// Default Food Database (can be replaced by custom foods)
const defaultFoodDatabase = [

];

// Get food database (custom foods + defaults)
function getFoodDatabase() {
    const customFoods = JSON.parse(localStorage.getItem('customFoods') || '[]');
    return [...customFoods, ...defaultFoodDatabase];
}

// App State
let state = {
    goals: {
        calories: 2000,
        carbs: 250,
        protein: 150,
        fat: 65
    },
    diary: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: []
    },
    measurements: [],
    currentDate: new Date().toISOString().split('T')[0],
    height: null // in inches for BMI calculation
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initializeMainNavigation();
    initializeSubNavigation();
    initializeDateDisplay();
    initializeButtons();
    updateDashboard();
    renderDiary();
    renderMyFoods();
    renderMeasurements();
    // Show sub-nav on initial load (nutrients is default)
    document.getElementById('subNavContainer').classList.add('active');
});

// Load state from localStorage
function loadState() {
    const saved = localStorage.getItem('huckleBunFitnessMacroState');
    if (saved) {
        const parsed = JSON.parse(saved);
        // Only load if it's for today
        if (parsed.currentDate === state.currentDate) {
            state = parsed;
        } else {
            // Reset diary for new day but keep goals
            state.diary = {
                breakfast: [],
                lunch: [],
                dinner: [],
                snacks: []
            };
            state.goals = parsed.goals || state.goals;
        }
    }
    // Ensure measurements array exists (for backward compatibility)
    if (!state.measurements) {
        state.measurements = [];
    }
    updateGoalsDisplay();
}

// Save state to localStorage
function saveState() {
    localStorage.setItem('huckleBunFitnessMacroState', JSON.stringify(state));
}

// Main Navigation (Nutrients vs Body Measurements)
function initializeMainNavigation() {
    const mainNavButtons = document.querySelectorAll('.main-nav-btn');
    mainNavButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            switchMainSection(section);
            mainNavButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function switchMainSection(sectionName) {
    // Hide all main sections
    document.querySelectorAll('.main-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(`${sectionName}Section`).classList.add('active');
    
    // Show/hide sub-nav based on section
    const subNavContainer = document.getElementById('subNavContainer');
    if (sectionName === 'nutrients') {
        subNavContainer.classList.add('active');
        // Show first page of nutrients section
        switchPage('dashboard');
    } else {
        subNavContainer.classList.remove('active');
    }
}

// Sub Navigation (Dashboard, Food Diary, etc.)
function initializeSubNavigation() {
    const subNavButtons = document.querySelectorAll('.sub-nav-btn');
    subNavButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            switchPage(page);
            subNavButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function switchPage(pageName) {
    // Only switch pages within the nutrients section
    const nutrientsSection = document.getElementById('nutrientsSection');
    if (nutrientsSection.classList.contains('active')) {
        document.querySelectorAll('#nutrientsSection .page').forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(pageName);
        if (targetPage) {
            targetPage.classList.add('active');
        }
    }
}

// Date Display
function initializeDateDisplay() {
    const dateDisplay = document.getElementById('dateDisplay');
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDisplay.textContent = today.toLocaleDateString('en-US', options);
}

// Buttons
function initializeButtons() {
    // Quick Add
    document.getElementById('quickAddBtn').addEventListener('click', () => {
        openQuickAddModal();
    });

    // Set Goals
    document.getElementById('setGoalsBtn').addEventListener('click', () => {
        openGoalsModal();
    });

    // Add Food buttons
    document.querySelectorAll('.add-food-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const meal = btn.dataset.meal;
            openFoodSearchModal(meal);
        });
    });

    // Modal closes - need to set up after DOM is ready
    setTimeout(() => {
        document.querySelectorAll('.close').forEach(close => {
            close.addEventListener('click', closeModals);
        });
    }, 100);

    // Save Goals
    document.getElementById('saveGoalsBtn').addEventListener('click', saveGoals);

    // Add Custom Food
    document.getElementById('addCustomFoodBtn').addEventListener('click', () => {
        openCustomFoodModal();
    });

    // My Foods Search
    document.getElementById('myFoodsSearch').addEventListener('input', (e) => {
        filterMyFoods(e.target.value);
    });

    // Add Measurement
    document.getElementById('addMeasurementBtn').addEventListener('click', () => {
        openMeasurementModal();
    });

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (e.target === modal) {
                closeModals();
            }
        });
    });
}

// Quick Add Modal
function openQuickAddModal() {
    const modal = document.getElementById('foodModal');
    const modalBody = document.getElementById('modalBody');
    const modalTitle = document.getElementById('modalTitle');
    
    modalTitle.textContent = 'Quick Add Food';
    modalBody.innerHTML = `
        <form class="food-form" id="quickAddForm">
            <div class="form-group">
                <label for="quickFoodName">Food Name</label>
                <input type="text" id="quickFoodName" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="quickCalories">Calories</label>
                    <input type="number" id="quickCalories" min="0" required>
                </div>
                <div class="form-group">
                    <label for="quickServing">Serving Size</label>
                    <input type="text" id="quickServing" placeholder="e.g., 100g" value="1 serving">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="quickProtein">Protein (g)</label>
                    <input type="number" id="quickProtein" min="0" value="0">
                </div>
                <div class="form-group">
                    <label for="quickCarbs">Carbs (g)</label>
                    <input type="number" id="quickCarbs" min="0" value="0">
                </div>
                <div class="form-group">
                    <label for="quickFat">Fat (g)</label>
                    <input type="number" id="quickFat" min="0" value="0">
                </div>
            </div>
            <div class="form-group">
                <label for="quickMeal">Meal</label>
                <select id="quickMeal" required>
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snacks">Snacks</option>
                </select>
            </div>
            <button type="submit" class="btn-primary">Add Food</button>
        </form>
    `;

    document.getElementById('quickAddForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const food = {
            name: document.getElementById('quickFoodName').value,
            calories: parseFloat(document.getElementById('quickCalories').value),
            protein: parseFloat(document.getElementById('quickProtein').value) || 0,
            carbs: parseFloat(document.getElementById('quickCarbs').value) || 0,
            fat: parseFloat(document.getElementById('quickFat').value) || 0,
            serving: document.getElementById('quickServing').value
        };
        const meal = document.getElementById('quickMeal').value;
        addFoodToMeal(food, meal);
        closeModals();
    });

    modal.classList.add('active');
    setupModalCloseButtons();
}

// Food Search Modal
function openFoodSearchModal(meal) {
    const modal = document.getElementById('foodModal');
    const modalBody = document.getElementById('modalBody');
    const modalTitle = document.getElementById('modalTitle');
    
    modalTitle.textContent = `Add Food to ${meal.charAt(0).toUpperCase() + meal.slice(1)}`;
    modalBody.innerHTML = `
        <div class="search-container">
            <input type="text" id="modalSearch" placeholder="Search for foods..." class="search-input">
            <button class="search-btn" id="modalSearchBtn">Search</button>
        </div>
        <div id="modalSearchResults" class="search-results" style="margin-top: 20px;"></div>
    `;

    // Show all foods initially
    displayFoodResults(getFoodDatabase(), meal);

    document.getElementById('modalSearchBtn').addEventListener('click', () => {
        const query = document.getElementById('modalSearch').value.toLowerCase();
        const filtered = getFoodDatabase().filter(food => 
            food.name.toLowerCase().includes(query)
        );
        displayFoodResults(filtered, meal);
    });

    document.getElementById('modalSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('modalSearchBtn').click();
        }
    });

    modal.classList.add('active');
    setupModalCloseButtons();
}

function displayFoodResults(foods, meal) {
    const resultsContainer = document.getElementById('modalSearchResults');
    
    if (foods.length === 0) {
        resultsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No foods found</p>';
        return;
    }

    resultsContainer.innerHTML = foods.map(food => `
        <div class="food-result" data-food-id="${food.id}">
            <div class="result-header">
                <span class="result-name">${food.name}</span>
                <span class="result-calories">${food.calories} cal</span>
            </div>
            <div class="result-macros">
                <span>P: ${food.protein}g</span>
                <span>C: ${food.carbs}g</span>
                <span>F: ${food.fat}g</span>
            </div>
        </div>
    `).join('');

    // Add click handlers
    resultsContainer.querySelectorAll('.food-result').forEach(result => {
        result.addEventListener('click', () => {
            const foodId = parseInt(result.dataset.foodId);
            const food = getFoodDatabase().find(f => f.id === foodId);
            if (food) {
                openServingModal(food, meal);
            }
        });
    });
}

function openServingModal(food, meal) {
    const modal = document.getElementById('foodModal');
    const modalBody = document.getElementById('modalBody');
    const modalTitle = document.getElementById('modalTitle');
    
    modalTitle.textContent = food.name;
    modalBody.innerHTML = `
        <form class="food-form" id="servingForm">
            <div class="form-group">
                <label for="servingSize">Serving Size (multiplier)</label>
                <input type="number" id="servingSize" min="0.1" step="0.1" value="1" required>
                <small style="color: var(--text-secondary); font-size: 12px;">Enter 1 for standard serving, 2 for double, 0.5 for half, etc.</small>
            </div>
            <div class="form-group">
                <label>Nutrition per serving:</label>
                <div style="background: var(--background); padding: 15px; border-radius: 8px; margin-top: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Calories:</span>
                        <span id="previewCalories">${food.calories}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Protein:</span>
                        <span id="previewProtein">${food.protein}g</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Carbs:</span>
                        <span id="previewCarbs">${food.carbs}g</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Fat:</span>
                        <span id="previewFat">${food.fat}g</span>
                    </div>
                </div>
            </div>
            <button type="submit" class="btn-primary">Add to ${meal.charAt(0).toUpperCase() + meal.slice(1)}</button>
        </form>
    `;

    const servingInput = document.getElementById('servingSize');
    servingInput.addEventListener('input', () => {
        const multiplier = parseFloat(servingInput.value) || 1;
        document.getElementById('previewCalories').textContent = Math.round(food.calories * multiplier);
        document.getElementById('previewProtein').textContent = (food.protein * multiplier).toFixed(1) + 'g';
        document.getElementById('previewCarbs').textContent = (food.carbs * multiplier).toFixed(1) + 'g';
        document.getElementById('previewFat').textContent = (food.fat * multiplier).toFixed(1) + 'g';
    });

    document.getElementById('servingForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const multiplier = parseFloat(servingInput.value) || 1;
        const servingSize = food.servingSize || '1 serving';
        const foodToAdd = {
            ...food,
            calories: Math.round(food.calories * multiplier),
            protein: food.protein * multiplier,
            carbs: food.carbs * multiplier,
            fat: food.fat * multiplier,
            serving: multiplier !== 1 ? `${multiplier}x ${servingSize} ${food.name}` : `${servingSize} ${food.name}`
        };
        addFoodToMeal(foodToAdd, meal);
        closeModals();
    });

    modal.classList.add('active');
    setupModalCloseButtons();
}

// Goals Modal
function openGoalsModal() {
    const modal = document.getElementById('goalsModal');
    document.getElementById('calorieGoalInput').value = state.goals.calories;
    document.getElementById('carbsGoalInput').value = state.goals.carbs;
    document.getElementById('proteinGoalInput').value = state.goals.protein;
    document.getElementById('fatGoalInput').value = state.goals.fat;
    modal.classList.add('active');
    setupModalCloseButtons();
}

function saveGoals() {
    state.goals = {
        calories: parseInt(document.getElementById('calorieGoalInput').value),
        carbs: parseInt(document.getElementById('carbsGoalInput').value),
        protein: parseInt(document.getElementById('proteinGoalInput').value),
        fat: parseInt(document.getElementById('fatGoalInput').value)
    };
    updateGoalsDisplay();
    updateDashboard();
    saveState();
    closeModals();
}

function updateGoalsDisplay() {
    document.getElementById('calorieGoal').textContent = state.goals.calories;
    document.getElementById('carbsGoal').textContent = state.goals.carbs + 'g goal';
    document.getElementById('proteinGoal').textContent = state.goals.protein + 'g goal';
    document.getElementById('fatGoal').textContent = state.goals.fat + 'g goal';
}

// Add Food to Meal
function addFoodToMeal(food, meal) {
    const foodEntry = {
        id: Date.now(),
        ...food
    };
    state.diary[meal].push(foodEntry);
    saveState();
    updateDashboard();
    renderDiary();
}

// Remove Food from Meal
function removeFood(meal, foodId) {
    state.diary[meal] = state.diary[meal].filter(food => food.id !== foodId);
    saveState();
    updateDashboard();
    renderDiary();
}

// Calculate Totals
function calculateTotals() {
    const totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
    };

    Object.values(state.diary).forEach(meal => {
        meal.forEach(food => {
            totals.calories += food.calories;
            totals.protein += food.protein;
            totals.carbs += food.carbs;
            totals.fat += food.fat;
        });
    });

    return totals;
}

function calculateMealTotals(meal) {
    return state.diary[meal].reduce((acc, food) => {
        acc.calories += food.calories;
        acc.protein += food.protein;
        acc.carbs += food.carbs;
        acc.fat += food.fat;
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

// Update Dashboard
function updateDashboard() {
    const totals = calculateTotals();

    // Update calories
    document.getElementById('caloriesConsumed').textContent = totals.calories;
    const caloriesRemaining = state.goals.calories - totals.calories;
    document.getElementById('caloriesRemaining').textContent = 
        `${caloriesRemaining >= 0 ? caloriesRemaining : 0} remaining`;

    // Update calorie circle
    const caloriePercent = Math.min((totals.calories / state.goals.calories) * 100, 100);
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (caloriePercent / 100) * circumference;
    document.getElementById('calorieProgress').style.strokeDashoffset = offset;

    // Update macros
    document.getElementById('carbsAmount').textContent = totals.carbs.toFixed(1) + 'g';
    document.getElementById('proteinAmount').textContent = totals.protein.toFixed(1) + 'g';
    document.getElementById('fatAmount').textContent = totals.fat.toFixed(1) + 'g';

    // Update macro bars
    const carbsPercent = Math.min((totals.carbs / state.goals.carbs) * 100, 100);
    const proteinPercent = Math.min((totals.protein / state.goals.protein) * 100, 100);
    const fatPercent = Math.min((totals.fat / state.goals.fat) * 100, 100);

    document.getElementById('carbsBar').style.width = carbsPercent + '%';
    document.getElementById('proteinBar').style.width = proteinPercent + '%';
    document.getElementById('fatBar').style.width = fatPercent + '%';
}

// Render Diary
function renderDiary() {
    const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];
    
    meals.forEach(meal => {
        const mealList = document.getElementById(`${meal}List`);
        const mealTotals = calculateMealTotals(meal);
        
        document.getElementById(`${meal}Calories`).textContent = `${Math.round(mealTotals.calories)} cal`;

        if (state.diary[meal].length === 0) {
            mealList.innerHTML = '<div class="empty-state">No foods added yet</div>';
        } else {
            mealList.innerHTML = state.diary[meal].map(food => `
                <div class="food-item">
                    <div class="food-info">
                        <div class="food-name">${food.serving || food.name}</div>
                        <div class="food-details">
                            P: ${food.protein.toFixed(1)}g | C: ${food.carbs.toFixed(1)}g | F: ${food.fat.toFixed(1)}g
                        </div>
                    </div>
                    <div class="food-actions">
                        <span class="food-calories">${food.calories} cal</span>
                        <button class="btn-remove" onclick="removeFood('${meal}', ${food.id})">Remove</button>
                    </div>
                </div>
            `).join('');
        }
    });
}

// Custom Foods Management
function getCustomFoods() {
    return JSON.parse(localStorage.getItem('customFoods') || '[]');
}

function saveCustomFoods(foods) {
    localStorage.setItem('customFoods', JSON.stringify(foods));
}

function openCustomFoodModal(foodToEdit = null) {
    const modal = document.getElementById('customFoodModal');
    const modalBody = document.getElementById('customFoodModalBody');
    const modalTitle = document.getElementById('customFoodModalTitle');
    
    const isEdit = foodToEdit !== null;
    modalTitle.textContent = isEdit ? 'Edit Food' : 'Add Custom Food';
    
    modalBody.innerHTML = `
        <form class="food-form" id="customFoodForm">
            <div class="form-group">
                <label for="customFoodName">Food Name</label>
                <input type="text" id="customFoodName" value="${isEdit ? foodToEdit.name : ''}" required>
            </div>
            <div class="form-group">
                <label for="customServingSize">Serving Size</label>
                <input type="text" id="customServingSize" value="${isEdit ? (foodToEdit.servingSize || '1 serving') : '1 serving'}" placeholder="e.g., 100g, 1 cup">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="customCalories">Calories</label>
                    <input type="number" id="customCalories" min="0" value="${isEdit ? foodToEdit.calories : ''}" required>
                </div>
                <div class="form-group">
                    <label for="customProtein">Protein (g)</label>
                    <input type="number" id="customProtein" min="0" value="${isEdit ? foodToEdit.protein : '0'}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="customCarbs">Carbs (g)</label>
                    <input type="number" id="customCarbs" min="0" value="${isEdit ? foodToEdit.carbs : '0'}">
                </div>
                <div class="form-group">
                    <label for="customFat">Fat (g)</label>
                    <input type="number" id="customFat" min="0" value="${isEdit ? foodToEdit.fat : '0'}">
                </div>
            </div>
            <button type="submit" class="btn-primary">${isEdit ? 'Update Food' : 'Add Food'}</button>
        </form>
    `;

    document.getElementById('customFoodForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const food = {
            id: isEdit ? foodToEdit.id : Date.now(),
            name: document.getElementById('customFoodName').value,
            servingSize: document.getElementById('customServingSize').value,
            calories: parseFloat(document.getElementById('customCalories').value),
            protein: parseFloat(document.getElementById('customProtein').value) || 0,
            carbs: parseFloat(document.getElementById('customCarbs').value) || 0,
            fat: parseFloat(document.getElementById('customFat').value) || 0
        };

        const customFoods = getCustomFoods();
        if (isEdit) {
            const index = customFoods.findIndex(f => f.id === foodToEdit.id);
            if (index !== -1) {
                customFoods[index] = food;
            }
        } else {
            customFoods.push(food);
        }
        saveCustomFoods(customFoods);
        renderMyFoods();
        closeModals();
    });

    modal.classList.add('active');
    setupModalCloseButtons();
}

function deleteCustomFood(foodId) {
    if (confirm('Are you sure you want to delete this food?')) {
        const customFoods = getCustomFoods().filter(f => f.id !== foodId);
        saveCustomFoods(customFoods);
        renderMyFoods();
    }
}

function renderMyFoods() {
    const customFoods = getCustomFoods();
    const container = document.getElementById('myFoodsList');
    
    if (customFoods.length === 0) {
        container.innerHTML = '<div class="empty-state">No custom foods yet. Click "Add Custom Food" to create your first one!</div>';
        return;
    }

    container.innerHTML = customFoods.map(food => `
        <div class="custom-food-item">
            <div class="custom-food-info">
                <div class="custom-food-name">${food.name}</div>
                <div class="custom-food-nutrition">
                    <span>${food.calories} cal</span>
                    <span>P: ${food.protein}g</span>
                    <span>C: ${food.carbs}g</span>
                    <span>F: ${food.fat}g</span>
                    <span style="color: var(--text-secondary);">• ${food.servingSize || '1 serving'}</span>
                </div>
            </div>
            <div class="custom-food-actions">
                <button class="btn-edit" onclick="editCustomFood(${food.id})">Edit</button>
                <button class="btn-delete-food" onclick="deleteCustomFood(${food.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function editCustomFood(foodId) {
    const customFoods = getCustomFoods();
    const food = customFoods.find(f => f.id === foodId);
    if (food) {
        openCustomFoodModal(food);
    }
}

function filterMyFoods(query) {
    const customFoods = getCustomFoods();
    const filtered = query ? customFoods.filter(food => 
        food.name.toLowerCase().includes(query.toLowerCase())
    ) : customFoods;
    
    const container = document.getElementById('myFoodsList');
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">No foods found</div>';
        return;
    }

    container.innerHTML = filtered.map(food => `
        <div class="custom-food-item">
            <div class="custom-food-info">
                <div class="custom-food-name">${food.name}</div>
                <div class="custom-food-nutrition">
                    <span>${food.calories} cal</span>
                    <span>P: ${food.protein}g</span>
                    <span>C: ${food.carbs}g</span>
                    <span>F: ${food.fat}g</span>
                    <span style="color: var(--text-secondary);">• ${food.servingSize || '1 serving'}</span>
                </div>
            </div>
            <div class="custom-food-actions">
                <button class="btn-edit" onclick="editCustomFood(${food.id})">Edit</button>
                <button class="btn-delete-food" onclick="deleteCustomFood(${food.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Close Modals
function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// Re-setup close buttons when modals are opened (for dynamically created modals)
function setupModalCloseButtons() {
    document.querySelectorAll('.modal .close').forEach(close => {
        close.onclick = closeModals;
    });
}

// Body Measurements Functions
function openMeasurementModal(measurementToEdit = null) {
    const modal = document.getElementById('measurementModal');
    const modalBody = document.getElementById('measurementModalBody');
    const modalTitle = document.getElementById('measurementModalTitle');
    
    const isEdit = measurementToEdit !== null;
    modalTitle.textContent = isEdit ? 'Edit Measurement' : 'Add Body Measurement';
    
    modalBody.innerHTML = `
        <form class="food-form" id="measurementForm">
            <div class="form-group">
                <label for="measurementDate">Date</label>
                <input type="date" id="measurementDate" value="${isEdit ? measurementToEdit.date : new Date().toISOString().split('T')[0]}" required>
            </div>
            <div class="form-group">
                <label for="measurementWeight">Weight (lbs)</label>
                <input type="number" id="measurementWeight" min="0" step="0.1" value="${isEdit ? measurementToEdit.weight : ''}" required>
            </div>
            <div class="form-group">
                <label for="measurementBodyFat">Body Fat %</label>
                <input type="number" id="measurementBodyFat" min="0" max="100" step="0.1" value="${isEdit ? (measurementToEdit.bodyFat || '') : ''}" placeholder="Optional">
            </div>
            <div class="form-group">
                <label for="measurementWater">Water %</label>
                <input type="number" id="measurementWater" min="0" max="100" step="0.1" value="${isEdit ? (measurementToEdit.water || '') : ''}" placeholder="Optional">
            </div>
            <div class="form-group">
                <label for="measurementMuscle">Muscle %</label>
                <input type="number" id="measurementMuscle" min="0" max="100" step="0.1" value="${isEdit ? (measurementToEdit.muscle || '') : ''}" placeholder="Optional">
            </div>
            <div class="form-group">
                <label for="measurementHeight">Height (inches) - for BMI calculation</label>
                <input type="number" id="measurementHeight" min="0" step="0.1" value="${isEdit ? (measurementToEdit.height || state.height || '') : (state.height || '')}" placeholder="Enter once, saved for all measurements">
            </div>
            <div class="form-group">
                <label for="measurementChest">Chest (inches)</label>
                <input type="number" id="measurementChest" min="0" step="0.1" value="${isEdit ? (measurementToEdit.chest || '') : ''}" placeholder="Optional">
            </div>
            <div class="form-group">
                <label for="measurementWaist">Waist (inches)</label>
                <input type="number" id="measurementWaist" min="0" step="0.1" value="${isEdit ? (measurementToEdit.waist || '') : ''}" placeholder="Optional">
            </div>
            <div class="form-group">
                <label for="measurementHips">Hips (inches)</label>
                <input type="number" id="measurementHips" min="0" step="0.1" value="${isEdit ? (measurementToEdit.hips || '') : ''}" placeholder="Optional">
            </div>
            <div class="form-group">
                <label for="measurementArms">Arms (inches)</label>
                <input type="number" id="measurementArms" min="0" step="0.1" value="${isEdit ? (measurementToEdit.arms || '') : ''}" placeholder="Optional">
            </div>
            <div class="form-group">
                <label for="measurementThighs">Thighs (inches)</label>
                <input type="number" id="measurementThighs" min="0" step="0.1" value="${isEdit ? (measurementToEdit.thighs || '') : ''}" placeholder="Optional">
            </div>
            <button type="submit" class="btn-primary">${isEdit ? 'Update Measurement' : 'Add Measurement'}</button>
        </form>
    `;

    document.getElementById('measurementForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const measurement = {
            id: isEdit ? measurementToEdit.id : Date.now(),
            date: document.getElementById('measurementDate').value,
            weight: parseFloat(document.getElementById('measurementWeight').value),
            bodyFat: document.getElementById('measurementBodyFat').value ? parseFloat(document.getElementById('measurementBodyFat').value) : null,
            water: document.getElementById('measurementWater').value ? parseFloat(document.getElementById('measurementWater').value) : null,
            muscle: document.getElementById('measurementMuscle').value ? parseFloat(document.getElementById('measurementMuscle').value) : null,
            height: document.getElementById('measurementHeight').value ? parseFloat(document.getElementById('measurementHeight').value) : null,
            chest: document.getElementById('measurementChest').value ? parseFloat(document.getElementById('measurementChest').value) : null,
            waist: document.getElementById('measurementWaist').value ? parseFloat(document.getElementById('measurementWaist').value) : null,
            hips: document.getElementById('measurementHips').value ? parseFloat(document.getElementById('measurementHips').value) : null,
            arms: document.getElementById('measurementArms').value ? parseFloat(document.getElementById('measurementArms').value) : null,
            thighs: document.getElementById('measurementThighs').value ? parseFloat(document.getElementById('measurementThighs').value) : null
        };

        // Save height to state if provided
        if (measurement.height) {
            state.height = measurement.height;
        }

        if (isEdit) {
            const index = state.measurements.findIndex(m => m.id === measurementToEdit.id);
            if (index !== -1) {
                state.measurements[index] = measurement;
            }
        } else {
            state.measurements.push(measurement);
        }

        // Sort measurements by date (newest first)
        state.measurements.sort((a, b) => new Date(b.date) - new Date(a.date));

        saveState();
        renderMeasurements();
        closeModals();
    });

    modal.classList.add('active');
    setupModalCloseButtons();
}

function deleteMeasurement(measurementId) {
    if (confirm('Are you sure you want to delete this measurement?')) {
        state.measurements = state.measurements.filter(m => m.id !== measurementId);
        saveState();
        renderMeasurements();
    }
}

function editMeasurement(measurementId) {
    const measurement = state.measurements.find(m => m.id === measurementId);
    if (measurement) {
        openMeasurementModal(measurement);
    }
}

function calculateBMI(weight, height) {
    if (!weight || !height) return null;
    // BMI = (weight in pounds / (height in inches)^2) * 703
    return ((weight / (height * height)) * 703).toFixed(1);
}

function renderMeasurements() {
    const container = document.getElementById('measurementsList');
    
    // Sort measurements by date (newest first)
    const sortedMeasurements = [...state.measurements].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    // Update current stats (use newest measurement)
    const latest = sortedMeasurements.length > 0 ? sortedMeasurements[0] : null;
    
    if (latest) {
        document.getElementById('currentWeight').textContent = latest.weight.toFixed(1);
        document.getElementById('currentBodyFat').textContent = latest.bodyFat ? latest.bodyFat.toFixed(1) : '--';
        document.getElementById('currentWater').textContent = latest.water ? latest.water.toFixed(1) : '--';
        document.getElementById('currentMuscle').textContent = latest.muscle ? latest.muscle.toFixed(1) : '--';
        const bmi = calculateBMI(latest.weight, latest.height || state.height);
        document.getElementById('currentBMI').textContent = bmi || '--';
    } else {
        document.getElementById('currentWeight').textContent = '--';
        document.getElementById('currentBodyFat').textContent = '--';
        document.getElementById('currentWater').textContent = '--';
        document.getElementById('currentMuscle').textContent = '--';
        document.getElementById('currentBMI').textContent = '--';
    }

    // Render measurement list
    if (sortedMeasurements.length === 0) {
        container.innerHTML = '<div class="empty-state">No measurements recorded yet. Click "Add Measurement" to get started!</div>';
        return;
    }

    container.innerHTML = sortedMeasurements.map(measurement => {
        const date = new Date(measurement.date);
        const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const bmi = calculateBMI(measurement.weight, measurement.height || state.height);
        
        return `
            <div class="measurement-item">
                <div class="measurement-info">
                    <div class="measurement-date">${dateStr}</div>
                    <div class="measurement-details">
                        <div class="measurement-detail-item">
                            <span class="measurement-detail-label">Weight</span>
                            <span class="measurement-detail-value">${measurement.weight.toFixed(1)} lbs</span>
                        </div>
                        ${measurement.bodyFat ? `
                        <div class="measurement-detail-item">
                            <span class="measurement-detail-label">Body Fat</span>
                            <span class="measurement-detail-value">${measurement.bodyFat.toFixed(1)}%</span>
                        </div>
                        ` : ''}
                        ${measurement.water ? `
                        <div class="measurement-detail-item">
                            <span class="measurement-detail-label">Water</span>
                            <span class="measurement-detail-value">${measurement.water.toFixed(1)}%</span>
                        </div>
                        ` : ''}
                        ${measurement.muscle ? `
                        <div class="measurement-detail-item">
                            <span class="measurement-detail-label">Muscle</span>
                            <span class="measurement-detail-value">${measurement.muscle.toFixed(1)}%</span>
                        </div>
                        ` : ''}
                        ${bmi ? `
                        <div class="measurement-detail-item">
                            <span class="measurement-detail-label">BMI</span>
                            <span class="measurement-detail-value">${bmi}</span>
                        </div>
                        ` : ''}
                        ${measurement.chest ? `
                        <div class="measurement-detail-item">
                            <span class="measurement-detail-label">Chest</span>
                            <span class="measurement-detail-value">${measurement.chest.toFixed(1)}"</span>
                        </div>
                        ` : ''}
                        ${measurement.waist ? `
                        <div class="measurement-detail-item">
                            <span class="measurement-detail-label">Waist</span>
                            <span class="measurement-detail-value">${measurement.waist.toFixed(1)}"</span>
                        </div>
                        ` : ''}
                        ${measurement.hips ? `
                        <div class="measurement-detail-item">
                            <span class="measurement-detail-label">Hips</span>
                            <span class="measurement-detail-value">${measurement.hips.toFixed(1)}"</span>
                        </div>
                        ` : ''}
                        ${measurement.arms ? `
                        <div class="measurement-detail-item">
                            <span class="measurement-detail-label">Arms</span>
                            <span class="measurement-detail-value">${measurement.arms.toFixed(1)}"</span>
                        </div>
                        ` : ''}
                        ${measurement.thighs ? `
                        <div class="measurement-detail-item">
                            <span class="measurement-detail-label">Thighs</span>
                            <span class="measurement-detail-value">${measurement.thighs.toFixed(1)}"</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="measurement-actions">
                    <button class="btn-edit" onclick="editMeasurement(${measurement.id})">Edit</button>
                    <button class="btn-delete-food" onclick="deleteMeasurement(${measurement.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Make functions available globally
window.removeFood = removeFood;
window.deleteCustomFood = deleteCustomFood;
window.editCustomFood = editCustomFood;
window.deleteMeasurement = deleteMeasurement;
window.editMeasurement = editMeasurement;
