const generateShoppingList = (meals) => {
  const shoppingMap = {};

  meals.forEach((meal) => {
    meal.ingredients.forEach((ingredient) => {
      const key = `${ingredient.name}-${ingredient.unit}`;

      if (shoppingMap[key]) {
        shoppingMap[key].quantity += ingredient.quantity;
      } else {
        shoppingMap[key] = {
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
        };
      }
    });
  });

  return Object.values(shoppingMap);
};

module.exports = generateShoppingList;
