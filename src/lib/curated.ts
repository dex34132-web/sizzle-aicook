import type { Meal } from "./mealdb";

// Helper to keep entries compact
type Ing = [string, string];
function meal(opts: {
  id: string;
  name: string;
  category: string;
  area: string;
  thumb: string;
  youtube?: string;
  tags?: string;
  instructions: string;
  ingredients: Ing[];
  premadeOf?: string; // id of the dish this is a premade base for
}): Meal {
  const m: Meal = {
    idMeal: opts.id,
    strMeal: opts.name,
    strCategory: opts.category,
    strArea: opts.area,
    strMealThumb: opts.thumb,
    strYoutube: opts.youtube,
    strTags: opts.tags ?? `${opts.area},${opts.category}`,
    strInstructions: opts.instructions,
  };
  opts.ingredients.forEach((p, i) => {
    m[`strIngredient${i + 1}`] = p[0];
    m[`strMeasure${i + 1}`] = p[1];
  });
  if (opts.premadeOf) m.strPremadeOf = opts.premadeOf;
  return m;
}

const IMG = {
  butterChicken: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=800",
  biryani: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&q=80&w=800",
  paneer: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=800",
  dal: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800",
  samosa: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800",
  masalaDosa: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=800",
  chole: "https://images.unsplash.com/photo-1626100134240-308d9a7e5d6f?auto=format&fit=crop&q=80&w=800",
  brisket: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800",
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
  macncheese: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&q=80&w=800",
  buffaloWings: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&q=80&w=800",
  pancakes: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&q=80&w=800",
  cheesecake: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&q=80&w=800",
  croissant: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800",
  ratatouille: "https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?auto=format&fit=crop&q=80&w=800",
  bourguignon: "https://images.unsplash.com/photo-1608500218890-c4f9019eaa6f?auto=format&fit=crop&q=80&w=800",
  coqAuVin: "https://images.unsplash.com/photo-1604908554007-4cf2d5e9b1d3?auto=format&fit=crop&q=80&w=800",
  creme: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=800",
  quiche: "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?auto=format&fit=crop&q=80&w=800",
  macarons: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&q=80&w=800",
  mochi: "https://images.unsplash.com/photo-1631206753348-db44968fd440?auto=format&fit=crop&q=80&w=800",
  tiramisu: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&q=80&w=800",
  lavaCake: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=800",
  browniePh: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=800",
  gulabJamun: "https://images.unsplash.com/photo-1601303516534-bf1f7a3eef4d?auto=format&fit=crop&q=80&w=800",
  // Dips & sauces
  guac: "https://images.unsplash.com/photo-1600335895229-6e75511892c8?auto=format&fit=crop&q=80&w=800",
  hummus: "https://images.unsplash.com/photo-1571197119282-7c4e2c1b5b9e?auto=format&fit=crop&q=80&w=800",
  chipotle: "https://images.unsplash.com/photo-1599909533730-3cf76e1f6a52?auto=format&fit=crop&q=80&w=800",
  marinara: "https://images.unsplash.com/photo-1572441713132-c542fc4fe282?auto=format&fit=crop&q=80&w=800",
  pesto: "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?auto=format&fit=crop&q=80&w=800",
  tzatziki: "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&q=80&w=800",
  ranch: "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?auto=format&fit=crop&q=80&w=800",
  bbqSauce: "https://images.unsplash.com/photo-1551782450-17144efb9c50?auto=format&fit=crop&q=80&w=800",
  hollandaise: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=800",
  // Premade base ingredients
  garamMasala: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800",
  pizzaDough: "https://images.unsplash.com/photo-1601924381811-687d77e96eea?auto=format&fit=crop&q=80&w=800",
  chickenStock: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=800",
  ghee: "https://images.unsplash.com/photo-1628689469838-524a4a973b8e?auto=format&fit=crop&q=80&w=800",
  curryPaste: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&q=80&w=800",
};

export const CURATED_MEALS: Meal[] = [
  // ===== INDIAN =====
  meal({
    id: "curated-butter-chicken",
    name: "Butter Chicken",
    category: "Chicken",
    area: "Indian",
    thumb: IMG.butterChicken,
    youtube: "https://www.youtube.com/watch?v=a03U45jFxOI",
    tags: "Indian,Curry,Creamy",
    instructions:
      "Marinate diced chicken thighs in yogurt, lemon juice, garam masala, turmeric, chili powder, ginger and garlic for at least 30 minutes. Sear the chicken in a hot pan until lightly charred and set aside. In the same pan, melt butter and sauté onions until soft, add tomato puree, kashmiri chili and salt; simmer 10 minutes. Blend silky, return to pan, stir in cream and butter, fold the chicken back in and simmer 5–8 minutes until thick. Finish with kasuri methi and serve with naan.",
    ingredients: [
      ["Chicken thighs", "600 g"], ["Yogurt", "1/2 cup"], ["Lemon juice", "1 tbsp"],
      ["Garam masala", "2 tsp"], ["Turmeric", "1/2 tsp"], ["Chili powder", "1 tsp"],
      ["Ginger paste", "1 tbsp"], ["Garlic paste", "1 tbsp"], ["Butter", "60 g"],
      ["Onion", "1 large"], ["Tomato puree", "400 g"], ["Heavy cream", "150 ml"],
      ["Kasuri methi", "1 tsp"], ["Salt", "to taste"],
    ],
  }),
  meal({
    id: "curated-chicken-biryani",
    name: "Hyderabadi Chicken Biryani",
    category: "Chicken",
    area: "Indian",
    thumb: IMG.biryani,
    youtube: "https://www.youtube.com/watch?v=AnVzYUTl21k",
    instructions:
      "Marinate chicken in yogurt, ginger-garlic, biryani masala, mint, coriander and salt for 1 hour. Parboil basmati rice with whole spices until 70% cooked, drain. Layer chicken, fried onions, mint and rice in a heavy pot, drizzle saffron milk and ghee, seal with dough or foil and dum-cook on low heat 25 minutes. Rest 10 minutes, then gently fluff and serve with raita.",
    ingredients: [
      ["Basmati rice", "500 g"], ["Chicken (bone-in)", "1 kg"], ["Yogurt", "1 cup"],
      ["Fried onions", "1 cup"], ["Ginger-garlic paste", "2 tbsp"], ["Biryani masala", "3 tbsp"],
      ["Mint leaves", "1/2 cup"], ["Coriander", "1/2 cup"], ["Saffron", "pinch"],
      ["Warm milk", "1/4 cup"], ["Ghee", "4 tbsp"], ["Whole spices", "as needed"], ["Salt", "to taste"],
    ],
  }),
  meal({
    id: "curated-paneer-tikka-masala",
    name: "Paneer Tikka Masala",
    category: "Vegetarian",
    area: "Indian",
    thumb: IMG.paneer,
    instructions:
      "Marinate paneer cubes and peppers in spiced yogurt; char on skewers or in a hot pan. Make a gravy of onions, tomatoes, cashews, ginger-garlic and Indian spices, blend smooth, then add cream and the tikka. Simmer 5 minutes and finish with crushed kasuri methi.",
    ingredients: [
      ["Paneer", "400 g"], ["Bell peppers", "1 cup"], ["Yogurt", "1/2 cup"],
      ["Onion", "2 medium"], ["Tomato", "3 medium"], ["Cashews", "10"],
      ["Ginger-garlic paste", "1 tbsp"], ["Garam masala", "1 tsp"], ["Chili powder", "1 tsp"],
      ["Cream", "1/4 cup"], ["Kasuri methi", "1 tsp"], ["Salt", "to taste"],
    ],
  }),
  meal({
    id: "curated-dal-makhani",
    name: "Dal Makhani",
    category: "Vegetarian",
    area: "Indian",
    thumb: IMG.dal,
    instructions:
      "Soak whole urad dal and kidney beans overnight. Pressure-cook with salt and turmeric until very soft. Make a tomato-onion-ginger-garlic tadka with butter, add the cooked lentils and simmer slow for 1 hour, stirring often. Finish with cream and a pat of butter; serve with rice or naan.",
    ingredients: [
      ["Whole urad dal", "1 cup"], ["Kidney beans", "1/4 cup"], ["Butter", "4 tbsp"],
      ["Onion", "1 large"], ["Tomato", "3 medium"], ["Ginger-garlic paste", "1 tbsp"],
      ["Garam masala", "1 tsp"], ["Chili powder", "1 tsp"], ["Cream", "1/2 cup"], ["Salt", "to taste"],
    ],
  }),
  meal({
    id: "curated-samosa",
    name: "Crispy Punjabi Samosa",
    category: "Vegetarian",
    area: "Indian",
    thumb: IMG.samosa,
    instructions:
      "Rub ghee into flour with ajwain and salt, add water sparingly to make a stiff dough; rest 30 min. Cook a filling of mashed potatoes, peas, ginger, green chili, cumin and garam masala. Roll dough discs, cut in half, form into cones, stuff and seal. Deep-fry on low heat until pale and crisp, then crank the heat to deep gold.",
    ingredients: [
      ["All-purpose flour", "2 cups"], ["Ghee", "4 tbsp"], ["Ajwain", "1 tsp"],
      ["Potatoes", "4 medium"], ["Green peas", "1/2 cup"], ["Green chili", "2"],
      ["Ginger", "1 tbsp"], ["Cumin seeds", "1 tsp"], ["Garam masala", "1 tsp"],
      ["Oil for frying", "as needed"], ["Salt", "to taste"],
    ],
  }),
  meal({
    id: "curated-masala-dosa",
    name: "Masala Dosa",
    category: "Vegetarian",
    area: "Indian",
    thumb: IMG.masalaDosa,
    instructions:
      "Soak rice and urad dal separately for 6 hours, grind into a smooth batter, ferment overnight. Make a potato masala with mustard seeds, curry leaves, onions, turmeric and green chili. Pour batter on a hot griddle, spread thin, drizzle ghee, crisp the edges, place masala in the centre and fold.",
    ingredients: [
      ["Rice", "2 cups"], ["Urad dal", "1/2 cup"], ["Methi seeds", "1 tsp"],
      ["Potato", "3 medium"], ["Onion", "1"], ["Mustard seeds", "1 tsp"],
      ["Curry leaves", "10"], ["Turmeric", "1/2 tsp"], ["Green chili", "2"],
      ["Ghee", "as needed"], ["Salt", "to taste"],
    ],
  }),
  meal({
    id: "curated-chole-bhature",
    name: "Chole Bhature",
    category: "Vegetarian",
    area: "Indian",
    thumb: IMG.chole,
    instructions:
      "Soak chickpeas overnight, pressure-cook with tea bag and salt until tender. In ghee, fry onions, ginger-garlic, tomato puree and chole masala; add chickpeas with cooking liquid and simmer 20 min. For bhature, knead flour with yogurt, semolina and baking powder, rest 2 hours, roll and deep-fry until puffed.",
    ingredients: [
      ["Chickpeas", "1.5 cups"], ["Tea bag", "1"], ["Onion", "2"], ["Tomato", "3"],
      ["Ginger-garlic paste", "1 tbsp"], ["Chole masala", "2 tbsp"], ["Flour", "2 cups"],
      ["Yogurt", "1/4 cup"], ["Semolina", "2 tbsp"], ["Baking powder", "1/2 tsp"],
      ["Oil", "for frying"], ["Salt", "to taste"],
    ],
  }),

  // ===== AMERICAN =====
  meal({
    id: "curated-texan-bbq",
    name: "Texan BBQ Brisket",
    category: "Beef",
    area: "American",
    thumb: IMG.brisket,
    youtube: "https://www.youtube.com/watch?v=hQzpVS_TucE",
    instructions:
      "Trim brisket leaving a 1/4-inch fat cap. Coat with 50/50 coarse pepper and kosher salt. Smoke fat-side up at 225°F over post oak until bark sets and internal temp hits 165°F (~6 hrs). Wrap in butcher paper and continue until probe-tender at 203°F (~4 hrs). Rest in a warm cooler 1 hour, slice the flat against the grain, serve with white bread and pickles.",
    ingredients: [
      ["Brisket", "5 kg"], ["Coarse pepper", "1/4 cup"], ["Kosher salt", "1/4 cup"],
      ["Post oak wood", "as needed"], ["Butcher paper", "1 roll"], ["White bread", "to serve"],
      ["Dill pickles", "to serve"], ["Sliced onion", "to serve"],
    ],
  }),
  meal({
    id: "curated-classic-cheeseburger",
    name: "Classic American Cheeseburger",
    category: "Beef",
    area: "American",
    thumb: IMG.burger,
    instructions:
      "Form 80/20 ground beef into loose 150g pucks, season liberally with salt and pepper just before cooking. Smash on a screaming hot griddle, flip after 90 seconds, melt American cheese on top, then sandwich in a toasted brioche bun with shredded lettuce, tomato, pickles and burger sauce.",
    ingredients: [
      ["Ground beef 80/20", "600 g"], ["Salt", "to taste"], ["Pepper", "to taste"],
      ["American cheese", "4 slices"], ["Brioche buns", "4"], ["Lettuce", "1 cup"],
      ["Tomato", "1"], ["Pickles", "8 slices"], ["Burger sauce", "1/4 cup"],
    ],
  }),
  meal({
    id: "curated-mac-and-cheese",
    name: "Baked Mac and Cheese",
    category: "Pasta",
    area: "American",
    thumb: IMG.macncheese,
    instructions:
      "Boil macaroni until just shy of al dente. Make a roux with butter and flour, whisk in milk to a silky béchamel, melt in sharp cheddar and gruyère, season with mustard powder and a pinch of nutmeg. Fold pasta in, transfer to a baking dish, top with buttered breadcrumbs and bake at 200°C until golden and bubbling.",
    ingredients: [
      ["Macaroni", "400 g"], ["Butter", "4 tbsp"], ["Flour", "4 tbsp"],
      ["Whole milk", "750 ml"], ["Sharp cheddar", "300 g"], ["Gruyère", "150 g"],
      ["Mustard powder", "1 tsp"], ["Nutmeg", "pinch"], ["Breadcrumbs", "1/2 cup"], ["Salt", "to taste"],
    ],
  }),
  meal({
    id: "curated-buffalo-wings",
    name: "Buffalo Wings",
    category: "Chicken",
    area: "American",
    thumb: IMG.buffaloWings,
    instructions:
      "Pat wings bone-dry, toss with baking powder and salt, refrigerate uncovered overnight. Bake at 250°F for 30 min then crank to 425°F until shatter-crisp. Melt butter into Frank's RedHot with a drop of vinegar and toss the wings hot. Serve with blue cheese dip and celery.",
    ingredients: [
      ["Chicken wings", "1 kg"], ["Baking powder", "1 tbsp"], ["Salt", "1 tsp"],
      ["Butter", "60 g"], ["Frank's RedHot", "1/2 cup"], ["White vinegar", "1 tsp"],
      ["Blue cheese dip", "to serve"], ["Celery sticks", "to serve"],
    ],
  }),
  meal({
    id: "curated-pancakes",
    name: "Fluffy Buttermilk Pancakes",
    category: "Breakfast",
    area: "American",
    thumb: IMG.pancakes,
    instructions:
      "Whisk flour, sugar, baking powder, baking soda and salt. Combine buttermilk, eggs and melted butter, fold into the dry mix leaving lumps. Rest 10 minutes. Ladle onto a buttered griddle on medium-low, flip when bubbles pop, cook 1 minute more. Stack and drown in maple syrup.",
    ingredients: [
      ["Flour", "250 g"], ["Sugar", "2 tbsp"], ["Baking powder", "2 tsp"],
      ["Baking soda", "1/2 tsp"], ["Salt", "1/2 tsp"], ["Buttermilk", "400 ml"],
      ["Eggs", "2"], ["Melted butter", "4 tbsp"], ["Maple syrup", "to serve"],
    ],
  }),

  // ===== FRENCH =====
  meal({
    id: "curated-coq-au-vin",
    name: "Coq au Vin",
    category: "Chicken",
    area: "French",
    thumb: IMG.coqAuVin,
    instructions:
      "Brown bacon lardons, then bone-in chicken pieces in the fat. Flambé with cognac, add a bottle of full-bodied red wine, chicken stock, tomato paste, garlic, thyme and a bouquet garni. Braise 1 hour. Sauté pearl onions and mushrooms separately and add at the end. Finish with a beurre manié to gloss the sauce.",
    ingredients: [
      ["Chicken pieces", "1.5 kg"], ["Bacon lardons", "200 g"], ["Cognac", "60 ml"],
      ["Red wine", "750 ml"], ["Chicken stock", "500 ml"], ["Tomato paste", "2 tbsp"],
      ["Garlic", "4 cloves"], ["Thyme", "few sprigs"], ["Pearl onions", "200 g"],
      ["Mushrooms", "250 g"], ["Butter + flour", "for beurre manié"], ["Salt + pepper", "to taste"],
    ],
  }),
  meal({
    id: "curated-ratatouille",
    name: "Provençal Ratatouille",
    category: "Vegetarian",
    area: "French",
    thumb: IMG.ratatouille,
    instructions:
      "Cook aubergine, courgette, peppers and onion separately in olive oil until just tender. Build a tomato concassé with garlic, herbes de Provence and a touch of sugar. Layer the cooked vegetables in the sauce in a baking dish, drizzle olive oil and slow-roast at 160°C for 45 minutes.",
    ingredients: [
      ["Aubergine", "2"], ["Courgette", "2"], ["Bell peppers", "2"],
      ["Onion", "1"], ["Tomato", "6"], ["Garlic", "3 cloves"],
      ["Herbes de Provence", "1 tbsp"], ["Olive oil", "as needed"], ["Salt", "to taste"],
    ],
  }),
  meal({
    id: "curated-beef-bourguignon",
    name: "Beef Bourguignon",
    category: "Beef",
    area: "French",
    thumb: IMG.bourguignon,
    instructions:
      "Brown cubed beef chuck in lardon fat. Deglaze with red wine, add beef stock, tomato paste, garlic and a bouquet garni. Braise gently 2.5 hours. Sauté pearl onions and mushrooms separately, fold in at the end, and adjust the sauce until glossy. Serve with mash or buttered noodles.",
    ingredients: [
      ["Beef chuck", "1.5 kg"], ["Bacon lardons", "200 g"], ["Red wine", "750 ml"],
      ["Beef stock", "500 ml"], ["Tomato paste", "2 tbsp"], ["Garlic", "4 cloves"],
      ["Bouquet garni", "1"], ["Pearl onions", "200 g"], ["Mushrooms", "250 g"], ["Salt + pepper", "to taste"],
    ],
  }),
  meal({
    id: "curated-croissant",
    name: "Classic French Croissant",
    category: "Breakfast",
    area: "French",
    thumb: IMG.croissant,
    youtube: "https://www.youtube.com/watch?v=NgcncXr3-jw",
    instructions:
      "Mix flour, sugar, salt, yeast, milk and softened butter into a dough; chill overnight. Pound cold butter into a slab. Lock butter into dough and complete three letter folds with 30-minute fridge rests. Roll to 4 mm, cut triangles, shape, proof until jiggly, egg-wash and bake at 220°C for 8 min then 190°C for 10 min until deeply golden.",
    ingredients: [
      ["Bread flour", "500 g"], ["Sugar", "55 g"], ["Salt", "10 g"], ["Yeast", "10 g"],
      ["Milk", "280 ml"], ["Soft butter", "40 g"], ["Cold butter", "280 g"], ["Egg", "1"],
    ],
  }),
  meal({
    id: "curated-quiche-lorraine",
    name: "Quiche Lorraine",
    category: "Starter",
    area: "French",
    thumb: IMG.quiche,
    instructions:
      "Blind-bake a buttery shortcrust shell. Fry bacon lardons until crisp, scatter in the shell with grated gruyère. Whisk cream, eggs, nutmeg and pepper; pour over and bake at 170°C until just set with a slight wobble.",
    ingredients: [
      ["Shortcrust pastry", "1 sheet"], ["Bacon lardons", "200 g"], ["Gruyère", "150 g"],
      ["Cream", "300 ml"], ["Eggs", "4"], ["Nutmeg", "pinch"], ["Pepper", "to taste"],
    ],
  }),

  // ===== DESSERTS =====
  meal({
    id: "curated-tiramisu",
    name: "Classic Tiramisu",
    category: "Dessert",
    area: "Italian",
    thumb: IMG.tiramisu,
    instructions:
      "Whip egg yolks with sugar over a bain-marie until pale and ribbony, fold in mascarpone, then fold in stiff egg whites. Briefly dip savoiardi in cooled espresso spiked with marsala and layer with the cream. Refrigerate 6 hours minimum. Dust with cocoa just before serving.",
    ingredients: [
      ["Egg yolks", "4"], ["Sugar", "100 g"], ["Mascarpone", "500 g"],
      ["Egg whites", "4"], ["Savoiardi", "300 g"], ["Espresso", "350 ml"],
      ["Marsala wine", "60 ml"], ["Cocoa powder", "to dust"],
    ],
  }),
  meal({
    id: "curated-lava-cake",
    name: "Molten Chocolate Lava Cake",
    category: "Dessert",
    area: "French",
    thumb: IMG.lavaCake,
    instructions:
      "Melt dark chocolate with butter, whisk in sugar, then eggs and yolks, fold in a little flour. Divide into buttered, cocoa-dusted ramekins and chill 30 minutes. Bake at 220°C for 9 minutes — the edges set, the centre stays molten. Invert onto plates and serve with vanilla ice cream.",
    ingredients: [
      ["Dark chocolate 70%", "200 g"], ["Butter", "200 g"], ["Sugar", "150 g"],
      ["Eggs", "3"], ["Egg yolks", "3"], ["Flour", "60 g"],
      ["Cocoa powder", "for dusting"], ["Vanilla ice cream", "to serve"],
    ],
  }),
  meal({
    id: "curated-cheesecake",
    name: "New York Cheesecake",
    category: "Dessert",
    area: "American",
    thumb: IMG.cheesecake,
    instructions:
      "Press a graham cracker and butter base into a springform, bake 10 min. Beat room-temp cream cheese smooth with sugar, add sour cream, vanilla, then eggs one at a time on low speed. Pour over base, bake in a water bath at 160°C for 70 minutes until just barely jiggling. Cool slowly in the oven, then chill overnight.",
    ingredients: [
      ["Graham crackers", "250 g"], ["Butter", "100 g"], ["Cream cheese", "900 g"],
      ["Sugar", "250 g"], ["Sour cream", "240 g"], ["Vanilla", "2 tsp"], ["Eggs", "4"],
    ],
  }),
  meal({
    id: "curated-macarons",
    name: "French Macarons",
    category: "Dessert",
    area: "French",
    thumb: IMG.macarons,
    instructions:
      "Sift almond flour with powdered sugar. Make an Italian meringue by drizzling 118°C sugar syrup into whipping egg whites. Fold the dry mix in, deflating until lava-like ribbons. Pipe onto silicone mats, rap to release bubbles, rest 30 min until skinned, bake at 150°C for 14 minutes. Sandwich with ganache or buttercream.",
    ingredients: [
      ["Almond flour", "150 g"], ["Powdered sugar", "150 g"], ["Sugar", "150 g"],
      ["Water", "50 ml"], ["Egg whites", "110 g"], ["Food coloring", "as desired"],
      ["Ganache filling", "1 cup"],
    ],
  }),
  meal({
    id: "curated-creme-brulee",
    name: "Crème Brûlée",
    category: "Dessert",
    area: "French",
    thumb: IMG.creme,
    instructions:
      "Infuse cream with split vanilla bean. Whisk egg yolks with sugar, temper with the warm cream, strain into ramekins. Bake in a water bath at 150°C until the edges set but centres wobble. Chill 4 hours, top with a thin even layer of sugar and torch until a glassy amber crust forms.",
    ingredients: [
      ["Heavy cream", "500 ml"], ["Vanilla bean", "1"], ["Egg yolks", "6"],
      ["Sugar (custard)", "80 g"], ["Sugar (crust)", "6 tsp"],
    ],
  }),
  meal({
    id: "curated-mochi",
    name: "Strawberry Daifuku Mochi",
    category: "Dessert",
    area: "Japanese",
    thumb: IMG.mochi,
    instructions:
      "Wrap each strawberry in red bean paste and chill. Microwave a slurry of glutinous rice flour, sugar and water in 1-minute bursts until glossy. Dust with potato starch, divide into 8, flatten, wrap each berry, pinch to seal.",
    ingredients: [
      ["Strawberries", "8"], ["Red bean paste", "200 g"], ["Glutinous rice flour", "100 g"],
      ["Sugar", "50 g"], ["Water", "160 ml"], ["Potato starch", "for dusting"],
    ],
  }),
  meal({
    id: "curated-gulab-jamun",
    name: "Gulab Jamun",
    category: "Dessert",
    area: "Indian",
    thumb: IMG.gulabJamun,
    instructions:
      "Mix khoya, flour and a pinch of baking soda with a splash of milk into a soft dough; rest 15 minutes, roll into smooth crack-free balls. Fry on low in ghee until deep gold, then drop straight into warm cardamom-rose sugar syrup. Soak at least 2 hours before serving.",
    ingredients: [
      ["Khoya", "200 g"], ["Flour", "3 tbsp"], ["Baking soda", "pinch"],
      ["Milk", "as needed"], ["Sugar", "400 g"], ["Water", "400 ml"],
      ["Cardamom", "4 pods"], ["Rose water", "1 tsp"], ["Ghee", "for frying"],
    ],
  }),

  // ===== DIPS & SAUCES (tutorials) =====
  meal({
    id: "curated-dip-guacamole",
    name: "Fresh Guacamole",
    category: "Dips & Sauces",
    area: "Mexican",
    thumb: IMG.guac,
    instructions:
      "Mash ripe avocados leaving some chunks. Stir in finely chopped onion, jalapeño, cilantro, lime juice and salt. Taste, adjust salt and lime. Press cling film against the surface if not serving immediately.",
    ingredients: [
      ["Ripe avocados", "3"], ["Red onion", "1/4 cup"], ["Jalapeño", "1"],
      ["Cilantro", "2 tbsp"], ["Lime juice", "2 tbsp"], ["Salt", "to taste"],
    ],
  }),
  meal({
    id: "curated-dip-hummus",
    name: "Silky Hummus",
    category: "Dips & Sauces",
    area: "Middle Eastern",
    thumb: IMG.hummus,
    instructions:
      "Simmer drained chickpeas with baking soda 10 min until skins slough off. Drain. Blend hot chickpeas with tahini, lemon juice, garlic, ice water and salt for at least 4 minutes until billowy. Pool olive oil and paprika on top.",
    ingredients: [
      ["Chickpeas", "400 g cooked"], ["Baking soda", "1/2 tsp"], ["Tahini", "1/2 cup"],
      ["Lemon juice", "3 tbsp"], ["Garlic", "1 clove"], ["Ice water", "3 tbsp"],
      ["Olive oil", "to serve"], ["Paprika", "pinch"], ["Salt", "to taste"],
    ],
  }),
  meal({
    id: "curated-dip-chipotle-mayo",
    name: "Chipotle Mayo",
    category: "Dips & Sauces",
    area: "American",
    thumb: IMG.chipotle,
    instructions:
      "Blend mayonnaise, chipotle in adobo, lime juice, garlic, smoked paprika and a pinch of salt until smooth and rust-red. Thin with a splash of water if you want a drizzle consistency.",
    ingredients: [
      ["Mayonnaise", "1 cup"], ["Chipotle in adobo", "2 tbsp"], ["Lime juice", "1 tbsp"],
      ["Garlic", "1 clove"], ["Smoked paprika", "1/2 tsp"], ["Salt", "to taste"],
    ],
  }),
  meal({
    id: "curated-sauce-marinara",
    name: "20-Minute Marinara",
    category: "Dips & Sauces",
    area: "Italian",
    thumb: IMG.marinara,
    instructions:
      "Gently fry sliced garlic in olive oil until just blond. Crush in whole San Marzano tomatoes, add a pinch of chili flake and salt, simmer 15–20 minutes until glossy. Tear in basil off the heat and finish with a glug of olive oil.",
    ingredients: [
      ["San Marzano tomatoes", "800 g"], ["Garlic", "4 cloves"], ["Olive oil", "1/4 cup"],
      ["Chili flakes", "pinch"], ["Basil", "small bunch"], ["Salt", "to taste"],
    ],
  }),
  meal({
    id: "curated-sauce-pesto",
    name: "Classic Basil Pesto",
    category: "Dips & Sauces",
    area: "Italian",
    thumb: IMG.pesto,
    instructions:
      "Pound (or briefly blitz) basil with garlic and salt, add toasted pine nuts and grated parmesan, then stream in olive oil to a loose paste. Avoid over-processing — heat from blending dulls the green.",
    ingredients: [
      ["Basil leaves", "100 g"], ["Garlic", "1 clove"], ["Pine nuts", "30 g"],
      ["Parmesan", "60 g"], ["Olive oil", "120 ml"], ["Salt", "to taste"],
    ],
  }),
  meal({
    id: "curated-sauce-tzatziki",
    name: "Greek Tzatziki",
    category: "Dips & Sauces",
    area: "Greek",
    thumb: IMG.tzatziki,
    instructions:
      "Grate cucumber, salt and squeeze dry in a tea towel. Mix into thick Greek yogurt with grated garlic, olive oil, lemon juice, chopped dill and salt. Chill 30 min so the flavors meld.",
    ingredients: [
      ["Greek yogurt", "500 g"], ["Cucumber", "1"], ["Garlic", "2 cloves"],
      ["Lemon juice", "1 tbsp"], ["Olive oil", "2 tbsp"], ["Dill", "2 tbsp"], ["Salt", "to taste"],
    ],
  }),
  meal({
    id: "curated-sauce-ranch",
    name: "Homemade Ranch",
    category: "Dips & Sauces",
    area: "American",
    thumb: IMG.ranch,
    instructions:
      "Whisk mayo, sour cream and buttermilk smooth. Stir in finely chopped dill, parsley, chives, garlic and onion powder, lemon juice, salt and pepper. Chill 1 hour before serving so the herbs perfume the dressing.",
    ingredients: [
      ["Mayo", "1 cup"], ["Sour cream", "1/2 cup"], ["Buttermilk", "1/2 cup"],
      ["Dill", "2 tbsp"], ["Parsley", "2 tbsp"], ["Chives", "2 tbsp"],
      ["Garlic powder", "1 tsp"], ["Onion powder", "1 tsp"], ["Lemon juice", "1 tsp"], ["Salt + pepper", "to taste"],
    ],
  }),
  meal({
    id: "curated-sauce-bbq",
    name: "Smoky BBQ Sauce",
    category: "Dips & Sauces",
    area: "American",
    thumb: IMG.bbqSauce,
    instructions:
      "Sweat onion and garlic in oil, add tomato ketchup, apple cider vinegar, brown sugar, molasses, Worcestershire, smoked paprika, mustard and a kiss of cayenne. Simmer 20 min until thick and glossy. Blitz smooth.",
    ingredients: [
      ["Onion", "1 small"], ["Garlic", "3 cloves"], ["Ketchup", "1.5 cups"],
      ["Apple cider vinegar", "1/4 cup"], ["Brown sugar", "1/3 cup"], ["Molasses", "2 tbsp"],
      ["Worcestershire", "2 tbsp"], ["Smoked paprika", "1 tbsp"], ["Mustard", "1 tbsp"], ["Cayenne", "pinch"],
    ],
  }),
  meal({
    id: "curated-sauce-hollandaise",
    name: "Foolproof Hollandaise",
    category: "Dips & Sauces",
    area: "French",
    thumb: IMG.hollandaise,
    instructions:
      "Whisk egg yolks and lemon juice over a bain-marie until pale and thickened, then slowly stream in warm melted butter, whisking constantly. Season with salt and a pinch of cayenne. Keep warm in a thermos until serving.",
    ingredients: [
      ["Egg yolks", "3"], ["Lemon juice", "1 tbsp"], ["Melted butter", "150 g"],
      ["Salt", "pinch"], ["Cayenne", "pinch"],
    ],
  }),

  // ===== PREMADE BASES (re-usable ingredients) =====
  meal({
    id: "curated-premade-garam-masala",
    name: "Homemade Garam Masala",
    category: "Premade",
    area: "Indian",
    thumb: IMG.garamMasala,
    premadeOf: "curated-butter-chicken",
    instructions:
      "Dry-toast the whole spices in a heavy pan over low heat until intensely fragrant, 3–4 minutes. Cool completely, then grind to a fine powder. Store in an airtight jar for up to 3 months.",
    ingredients: [
      ["Cumin seeds", "3 tbsp"], ["Coriander seeds", "3 tbsp"], ["Cardamom pods", "2 tbsp"],
      ["Cloves", "1 tbsp"], ["Cinnamon", "2 sticks"], ["Black peppercorns", "1 tbsp"],
      ["Nutmeg", "1/2 tsp"], ["Bay leaves", "2"],
    ],
  }),
  meal({
    id: "curated-premade-pizza-dough",
    name: "Overnight Pizza Dough",
    category: "Premade",
    area: "Italian",
    thumb: IMG.pizzaDough,
    instructions:
      "Mix 00 flour, salt, instant yeast and water into a shaggy dough, knead 8 min. Bulk-ferment in the fridge 24 hours, divide into 250 g balls, proof 4 hours at room temp before stretching.",
    ingredients: [
      ["00 flour", "1 kg"], ["Salt", "25 g"], ["Yeast", "3 g"], ["Water", "650 ml"],
    ],
  }),
  meal({
    id: "curated-premade-chicken-stock",
    name: "Roast Chicken Stock",
    category: "Premade",
    area: "French",
    thumb: IMG.chickenStock,
    instructions:
      "Roast chicken bones at 220°C until deeply browned. Transfer to a stockpot with onion, carrot, celery, leek, parsley stems, peppercorns and bay. Cover with cold water, bring to a bare simmer and cook 4 hours skimming often. Strain, chill, lift the fat cap.",
    ingredients: [
      ["Chicken bones", "2 kg"], ["Onion", "2"], ["Carrot", "2"], ["Celery", "3 sticks"],
      ["Leek", "1"], ["Parsley stems", "small bunch"], ["Peppercorns", "1 tsp"], ["Bay leaves", "2"],
    ],
  }),
  meal({
    id: "curated-premade-ghee",
    name: "Cultured Ghee",
    category: "Premade",
    area: "Indian",
    thumb: IMG.ghee,
    premadeOf: "curated-dal-makhani",
    instructions:
      "Melt cultured butter over low heat. As it foams, the milk solids drop to the bottom and turn nutty brown. Once the bubbling stops and the liquid is clear gold, strain through cheesecloth and store in a clean jar.",
    ingredients: [["Cultured butter", "500 g"]],
  }),
  meal({
    id: "curated-premade-curry-paste",
    name: "Thai Red Curry Paste",
    category: "Premade",
    area: "Thai",
    thumb: IMG.curryPaste,
    instructions:
      "Toast cumin, coriander and white pepper. Pound with dried chilies, garlic, shallots, galangal, lemongrass, kaffir lime zest, cilantro root, shrimp paste and salt into a smooth red paste. Freezes well in tablespoon-sized portions.",
    ingredients: [
      ["Dried red chilies", "15"], ["Garlic", "10 cloves"], ["Shallots", "6"],
      ["Galangal", "2 tbsp"], ["Lemongrass", "3 stalks"], ["Kaffir lime zest", "1 tsp"],
      ["Cilantro root", "2 tbsp"], ["Shrimp paste", "1 tbsp"], ["Cumin", "1 tsp"],
      ["Coriander", "1 tbsp"], ["White pepper", "1 tsp"], ["Salt", "1 tsp"],
    ],
  }),
];

export function getCuratedById(id: string): Meal | null {
  return CURATED_MEALS.find((m) => m.idMeal === id) ?? null;
}

export function getCuratedByCategory(category: string): Meal[] {
  const c = category.toLowerCase();
  return CURATED_MEALS.filter((m) => (m.strCategory ?? "").toLowerCase() === c);
}

export function getCuratedByArea(area: string): Meal[] {
  const a = area.toLowerCase();
  return CURATED_MEALS.filter((m) => (m.strArea ?? "").toLowerCase() === a);
}

// Areas TheMealDB free API has no data for — we approximate with search queries
// that DO return results so rows are never empty.
export const CUISINE_FALLBACK_QUERIES: Record<string, string[]> = {
  Indian: ["curry", "biryani", "tandoori", "masala", "paneer", "dal", "tikka"],
  American: ["burger", "bbq", "pancake", "brownie", "cheesecake", "fried chicken", "pie"],
  French: ["ratatouille", "tart", "souffle", "croissant", "creme", "quiche", "macaron"],
};
