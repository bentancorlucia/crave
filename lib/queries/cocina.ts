import { createClient } from "@/lib/supabase/server";

export type IngredientUnit = "kg" | "g" | "l" | "ml" | "unidad";

export type IngredientWithStock = {
  id: string;
  name: string;
  unit: IngredientUnit;
  low_stock_threshold: number;
  current_stock: number;
  last_unit_cost_cents: number | null;
};

export async function listIngredients(): Promise<IngredientWithStock[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ingredients")
    .select("id, name, unit, low_stock_threshold")
    .order("name");
  if (error) throw error;

  const ids = (data ?? []).map((i) => i.id);
  if (!ids.length) return [];

  const { data: stockRows } = await supabase
    .from("v_ingredient_stock")
    .select("ingredient_id, current_stock, last_unit_cost_cents")
    .in("ingredient_id", ids);
  const byId = new Map(
    (stockRows ?? []).map((s) => [
      s.ingredient_id,
      {
        current_stock: Number(s.current_stock ?? 0),
        last_unit_cost_cents: s.last_unit_cost_cents ? Number(s.last_unit_cost_cents) : null,
      },
    ]),
  );

  return (data ?? []).map((i) => ({
    id: i.id as string,
    name: i.name as string,
    unit: i.unit as IngredientUnit,
    low_stock_threshold: Number(i.low_stock_threshold),
    current_stock: byId.get(i.id)?.current_stock ?? 0,
    last_unit_cost_cents: byId.get(i.id)?.last_unit_cost_cents ?? null,
  }));
}

export async function getIngredientById(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ingredients")
    .select("id, name, unit, low_stock_threshold, note")
    .eq("id", id)
    .single();
  if (!data) return null;
  const { data: stock } = await supabase
    .from("v_ingredient_stock")
    .select("current_stock, last_unit_cost_cents")
    .eq("ingredient_id", id)
    .single();
  return {
    ...data,
    low_stock_threshold: Number(data.low_stock_threshold),
    current_stock: Number(stock?.current_stock ?? 0),
    last_unit_cost_cents: stock?.last_unit_cost_cents ? Number(stock.last_unit_cost_cents) : null,
  };
}

export async function listIngredientLots(ingredientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ingredient_purchases")
    .select(
      `id, quantity_purchased, quantity_remaining, total_cost_cents, unit_cost_cents,
       purchased_on, note, created_at,
       registered_by_profile:profiles!ingredient_purchases_registered_by_fkey ( display_name, initial )`,
    )
    .eq("ingredient_id", ingredientId)
    .order("purchased_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    ...row,
    registered_by_profile: Array.isArray(row.registered_by_profile)
      ? row.registered_by_profile[0] ?? null
      : row.registered_by_profile,
  }));
}

export async function getLowStockIngredients() {
  const all = await listIngredients();
  return all.filter((i) => i.current_stock < i.low_stock_threshold && i.low_stock_threshold > 0);
}

// =============================================================================
// Productos y recetas
// =============================================================================

export type ProductWithCost = {
  id: string;
  name: string;
  description: string | null;
  sale_price_cents: number;
  active: boolean;
  current_cost_cents: number | null;
  recipe_complete: boolean;
};

export async function listProducts(activeOnly = true): Promise<ProductWithCost[]> {
  const supabase = await createClient();
  let q = supabase
    .from("products")
    .select("id, name, description, sale_price_cents, active")
    .order("name");
  if (activeOnly) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  if (!data?.length) return [];

  const productIds = data.map((p) => p.id);
  const { data: recipes } = await supabase
    .from("recipes")
    .select("product_id, ingredient_id, quantity")
    .in("product_id", productIds);

  const ingredientIds = Array.from(
    new Set((recipes ?? []).map((r) => r.ingredient_id as string)),
  );
  const { data: stock } = ingredientIds.length
    ? await supabase
        .from("v_ingredient_stock")
        .select("ingredient_id, last_unit_cost_cents")
        .in("ingredient_id", ingredientIds)
    : { data: [] as any[] };

  const costByIngredient = new Map<string, number | null>();
  (stock ?? []).forEach((s) =>
    costByIngredient.set(
      s.ingredient_id as string,
      s.last_unit_cost_cents ? Number(s.last_unit_cost_cents) : null,
    ),
  );

  const recipesByProduct = new Map<string, Array<{ ingredient_id: string; quantity: number }>>();
  (recipes ?? []).forEach((r) => {
    const arr = recipesByProduct.get(r.product_id as string) ?? [];
    arr.push({ ingredient_id: r.ingredient_id as string, quantity: Number(r.quantity) });
    recipesByProduct.set(r.product_id as string, arr);
  });

  return data.map((p) => {
    const recipe = recipesByProduct.get(p.id) ?? [];
    let cost = 0;
    let complete = recipe.length > 0;
    for (const r of recipe) {
      const unit = costByIngredient.get(r.ingredient_id);
      if (unit == null) {
        complete = false;
        break;
      }
      cost += r.quantity * unit;
    }
    return {
      id: p.id as string,
      name: p.name as string,
      description: (p.description as string | null) ?? null,
      sale_price_cents: Number(p.sale_price_cents),
      active: !!p.active,
      current_cost_cents: complete ? Math.round(cost) : null,
      recipe_complete: complete,
    };
  });
}

export async function getProductWithRecipe(productId: string) {
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, name, description, sale_price_cents, active")
    .eq("id", productId)
    .single();
  if (!product) return null;

  const { data: recipeRows } = await supabase
    .from("recipes")
    .select(
      `ingredient_id, quantity,
       ingredient:ingredients ( id, name, unit )`,
    )
    .eq("product_id", productId);

  const ingredientIds = (recipeRows ?? []).map((r: any) => r.ingredient_id);
  const { data: stock } = ingredientIds.length
    ? await supabase
        .from("v_ingredient_stock")
        .select("ingredient_id, last_unit_cost_cents")
        .in("ingredient_id", ingredientIds)
    : { data: [] as any[] };

  const costMap = new Map<string, number | null>();
  (stock ?? []).forEach((s: any) =>
    costMap.set(s.ingredient_id, s.last_unit_cost_cents ? Number(s.last_unit_cost_cents) : null),
  );

  const recipe = (recipeRows ?? []).map((r: any) => {
    const ing = Array.isArray(r.ingredient) ? r.ingredient[0] : r.ingredient;
    const unitCost = costMap.get(r.ingredient_id) ?? null;
    return {
      ingredient_id: r.ingredient_id as string,
      quantity: Number(r.quantity),
      ingredient: ing as { id: string; name: string; unit: IngredientUnit },
      unit_cost_cents: unitCost,
      line_cost_cents: unitCost != null ? Math.round(Number(r.quantity) * unitCost) : null,
    };
  });

  const totalCost = recipe.every((r) => r.line_cost_cents != null)
    ? recipe.reduce((acc, r) => acc + (r.line_cost_cents ?? 0), 0)
    : null;

  return {
    product: {
      ...product,
      sale_price_cents: Number(product.sale_price_cents),
    },
    recipe,
    current_cost_cents: totalCost,
  };
}
