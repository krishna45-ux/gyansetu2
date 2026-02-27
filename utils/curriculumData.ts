
// Data Structure for Syllabus (Classes 6-10)
export const SYLLABUS_DATA: Record<number, Record<string, string[]>> = {
    6: {
        "Mathematics": ["Knowing Our Numbers", "Whole Numbers", "Playing with Numbers", "Basic Geometrical Ideas", "Integers", "Fractions", "Decimals", "Data Handling", "Mensuration", "Algebra"],
        "Science": ["Food: Where Does It Come From?", "Components of Food", "Fibre to Fabric", "Sorting Materials into Groups", "Separation of Substances", "Changes Around Us", "Getting to Know Plants", "Body Movements", "The Living Organisms", "Motion and Measurement"],
        "English": ["Who Did Patrick's Homework?", "How the Dog Found Himself a New Master", "Taro's Reward", "An Indian American Woman in Space", "A Different Kind of School", "Who I Am", "Fair Play"],
        "Social Science": ["What, Where, How and When?", "From Hunting-Gathering to Growing Food", "In the Earliest Cities", "What Books and Burials Tell Us", "Kingdoms, Kings and an Early Republic", "New Questions and Ideas"]
    },
    7: {
        "Mathematics": ["Integers", "Fractions and Decimals", "Data Handling", "Simple Equations", "Lines and Angles", "The Triangle and its Properties", "Congruence of Triangles", "Comparing Quantities", "Rational Numbers", "Practical Geometry"],
        "Science": ["Nutrition in Plants", "Nutrition in Animals", "Fibre to Fabric", "Heat", "Acids, Bases and Salts", "Physical and Chemical Changes", "Weather, Climate and Adaptations", "Winds, Storms and Cyclones", "Soil", "Respiration in Organisms"],
        "English": ["Three Questions", "A Gift of Chappals", "Gopal and the Hilsa Fish", "The Ashes That Made Trees Bloom", "Quality", "Expert Detectives", "The Invention of Vita-Wonk"],
        "Social Science": ["Tracing Changes Through a Thousand Years", "New Kings and Kingdoms", "The Delhi Sultans", "The Mughal Empire", "Rulers and Buildings", "Towns, Traders and Craftspersons"]
    },
    8: {
        "Mathematics": ["Rational Numbers", "Linear Equations in One Variable", "Understanding Quadrilaterals", "Practical Geometry", "Data Handling", "Squares and Square Roots", "Cubes and Cube Roots", "Comparing Quantities", "Algebraic Expressions", "Visualising Solid Shapes"],
        "Science": ["Crop Production and Management", "Microorganisms: Friend and Foe", "Synthetic Fibres and Plastics", "Materials: Metals and Non-Metals", "Coal and Petroleum", "Combustion and Flame", "Conservation of Plants and Animals", "Cell - Structure and Functions", "Reproduction in Animals", "Reaching the Age of Adolescence"],
        "English": ["The Best Christmas Present in the World", "The Tsunami", "Glimpses of the Past", "Bepin Choudhury's Lapse of Memory", "The Summit Within", "This is Jody's Fawn"],
        "Social Science": ["How, When and Where", "From Trade to Territory", "Ruling the Countryside", "Tribals, Dikus and the Vision of a Golden Age", "When People Rebel", "Weavers, Iron Smelters and Factory Owners"]
    },
    9: {
        "Mathematics": ["Number Systems", "Polynomials", "Coordinate Geometry", "Linear Equations in Two Variables", "Introduction to Euclid's Geometry", "Lines and Angles", "Triangles", "Quadrilaterals", "Circles", "Heron's Formula", "Surface Areas and Volumes", "Statistics"],
        "Science": ["Matter in Our Surroundings", "Is Matter Around Us Pure", "Atoms and Molecules", "Structure of the Atom", "The Fundamental Unit of Life", "Tissues", "Motion", "Force and Laws of Motion", "Gravitation", "Work and Energy", "Sound", "Improvement in Food Resources"],
        "English": ["The Fun They Had", "The Sound of Music", "The Little Girl", "A Truly Beautiful Mind", "The Snake and the Mirror", "My Childhood", "Packing", "Reach for the Top", "The Bond of Love"],
        "Social Science": ["The French Revolution", "Socialism in Europe and the Russian Revolution", "Nazism and the Rise of Hitler", "Forest Society and Colonialism", "Pastoralists in the Modern World", "India - Size and Location", "Physical Features of India"]
    },
    10: {
        "Mathematics": ["Real Numbers", "Polynomials", "Pair of Linear Equations in Two Variables", "Quadratic Equations", "Arithmetic Progressions", "Triangles", "Coordinate Geometry", "Introduction to Trigonometry", "Some Applications of Trigonometry", "Circles", "Constructions", "Areas Related to Circles", "Surface Areas and Volumes", "Statistics", "Probability"],
        "Science": ["Chemical Reactions and Equations", "Acids, Bases and Salts", "Metals and Non-Metals", "Carbon and its Compounds", "Periodic Classification of Elements", "Life Processes", "Control and Coordination", "How do Organisms Reproduce?", "Heredity and Evolution", "Light – Reflection and Refraction", "The Human Eye and the Colourful World", "Electricity", "Magnetic Effects of Electric Current", "Sources of Energy", "Our Environment"],
        "English": ["A Letter to God", "Nelson Mandela: Long Walk to Freedom", "Two Stories about Flying", "From the Diary of Anne Frank", "The Hundred Dresses - I", "The Hundred Dresses - II", "Glimpses of India", "Mijbil the Otter", "Madam Rides the Bus", "The Sermon at Benares", "The Proposal"],
        "Social Science": ["The Rise of Nationalism in Europe", "Nationalism in India", "The Making of a Global World", "The Age of Industrialisation", "Print Culture and the Modern World", "Resources and Development", "Forest and Wildlife Resources", "Water Resources", "Agriculture", "Minerals and Energy Resources"]
    }
};

export const SUBJECT_ICONS: Record<string, string> = {
    "Mathematics": "solar:calculator-bold",
    "Science": "solar:atom-bold",
    "English": "solar:book-bookmark-bold",
    "Social Science": "solar:globe-bold"
};

export interface WordOfTheDay {
    text: string;
    hindiText: string;
    phonetic: string;
    type: string;
    meaning: string;
    example: string;
}

export const DAILY_WORD: WordOfTheDay = {
    text: "Resilience",
    hindiText: "लचीलापन (Lachilapan)",
    phonetic: "/rəˈzilyəns/",
    type: "Noun",
    meaning: "The capacity to withstand or to recover quickly from difficulties; toughness.",
    example: "Mental resilience is essential for long-term success."
};

// --- YOUTUBE VIDEO MAPPING ---
// Add your YouTube Video IDs here.
// Key: Chapter Name (Must match SYLLABUS_DATA exactly)
// Value: YouTube Video ID (e.g. for https://www.youtube.com/watch?v=dQw4w9WgXcQ, the ID is dQw4w9WgXcQ)
export const CHAPTER_VIDEO_MAP: Record<string, string> = {
    // CLASS 6
    "Knowing Our Numbers": "OoO5d5P0Jn4",
    "Food: Where Does It Come From?": "OoO5d5P0Jn4",

    // CLASS 9 SCIENCE 
    "Motion": "OoO5d5P0Jn4", 
    "Force and Laws of Motion": "OoO5d5P0Jn4",
    "Gravitation": "OoO5d5P0Jn4",
    "Work and Energy": "OoO5d5P0Jn4",
    "Sound": "OoO5d5P0Jn4",
    "Atoms and Molecules": "OoO5d5P0Jn4",
    
    // CLASS 9 MATH 
    "Number Systems": "OoO5d5P0Jn4",
    "Polynomials": "OoO5d5P0Jn4",
    
    // CLASS 10 SCIENCE
    "Chemical Reactions and Equations": "OoO5d5P0Jn4",
    "Life Processes": "OoO5d5P0Jn4",
    "Electricity": "OoO5d5P0Jn4",
    
    // CLASS 10 SOCIAL SCIENCE
    "Nationalism in India": "OoO5d5P0Jn4"
    
    // Note: If a chapter is missing here, the app uses a default fallback video.
};
