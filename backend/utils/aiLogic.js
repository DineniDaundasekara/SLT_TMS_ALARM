const Meal = require("../models/smartShopping/Meal");

const shuffleArray = (array) => {
  return array.sort(() => Math.random() - 0.5); // Shuffle array randomly
};

const generateWeeklyMealPlan = async (
  weeklyBudget,
  dailyCalorieGoal = 2000
) => {
  try {
    const daysOfWeek = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const mealCategoryPriority = ["Breakfast", "Dinner", "Lunch"];
    const snackCategory = "Snack";
    let weeklyMealPlan = [];
    let totalCost = 0;
    let selectedMeals = new Set(); // Track selected meals to avoid repetition
    let snacks = []; // Store snacks separately

    for (const day of daysOfWeek) {
      let totalDailyCalories = 0;
      let dailyMeals = [];
      let selectedCategories = new Set();

      // Shuffle meal list uniquely for each day
      for (const category of shuffleArray(mealCategoryPriority)) {
        let meals = await Meal.find({ category }).lean();
        meals = shuffleArray(meals); // Randomize selection

        for (const meal of meals) {
          if (
            !selectedCategories.has(category) &&
            !selectedMeals.has(meal._id.toString()) &&
            totalCost + meal.price <= weeklyBudget &&
            totalDailyCalories + meal.calories <= dailyCalorieGoal
          ) {
            dailyMeals.push({
              _id: meal._id,
              name: meal.name,
              price: meal.price,
              description: meal.description,
              category: meal.category,
              calories: meal.calories,
            });

            totalCost += meal.price;
            totalDailyCalories += meal.calories;
            selectedCategories.add(category);
            selectedMeals.add(meal._id.toString()); // Track selected meals
            break; // Ensure one meal per category
          }
        }
      }

      weeklyMealPlan.push({
        day,
        meals: dailyMeals,
        totalDailyCalories,
      });
    }

    // **🔹 Add Snacks if Budget Allows**
    let remainingBudget = weeklyBudget - totalCost;
    if (remainingBudget > 0) {
      let snackMeals = await Meal.find({ category: snackCategory }).lean();
      snackMeals = shuffleArray(snackMeals); // Randomize snack selection

      for (const snackMeal of snackMeals) {
        if (remainingBudget >= snackMeal.price) {
          snacks.push({
            _id: snackMeal._id,
            name: snackMeal.name,
            price: snackMeal.price,
            description: snackMeal.description,
            category: snackMeal.category,
            calories: snackMeal.calories,
          });

          totalCost += snackMeal.price;
          remainingBudget -= snackMeal.price;
        }
      }
    }

    return {
      weeklyMealPlan, // Meals per day
      snacks, // All snacks stored together
      totalCost,
      remainingBudget: Math.max(0, weeklyBudget - totalCost), // Ensure non-negative budget
    };
  } catch (error) {
    throw new Error("Error generating weekly meal plan: " + error.message);
  }
};

module.exports = { generateWeeklyMealPlan };
