const gameWords = {
    easy: {
        words: ["CAT", "DOG", "SUN", "RUN", "BIG", "RED", "FUN", "JOY", "KEY", "SKY", "ART", "BED", "BOX", "BOY", "BUS", "CAN", "CAR", "CUP", "CUT", "DAY", "EAR", "EAT", "EGG", "END", "EYE", "FLY", "FOG", "FOR", "GET", "GUY", "HAT", "HEN", "HER", "HIM", "HIS", "HOT", "ICE", "INK", "JAM", "JAR"],
        count: 3, // Number of words to pick for a level
        minLength: 3,
        maxLength: 3
    },
    medium: {
        words: ["APPLE", "BEACH", "BRAIN", "CHAIR", "DANCE", "EARTH", "FRUIT", "GHOST", "HAPPY", "LIGHT", "MAGIC", "MONEY", "MUSIC", "NIGHT", "OCEAN", "PARTY", "PIZZA", "PLANT", "QUIET", "RIVER", "ANGEL", "BREAD", "BRICK", "CLOUD", "COAST", "CYCLE", "DREAM", "DRINK", "EAGLE", "FIELD", "FLAME", "FLOWER", "FOREST", "GREEN", "GUARD", "HEART", "HONEY", "HORSE", "HOTEL", "HOUSE", "IMAGE", "ISLAND", "JELLY", "JUICE", "JUNGLE", "KNIFE", "LEMON", "LUNCH", "MAPLE", "MONTH"],
        count: 5,
        minLength: 4,
        maxLength: 5
    },
    hard: {
        words: ["ADVENTURE", "BEAUTIFUL", "CHALLENGE", "COMPUTER", "CREATIVE", "DANGEROUS", "EDUCATION", "EXCELLENT", "FANTASY", "FREEDOM", "GENEROUS", "HAPPINESS", "IMAGINE", "JOURNEY", "KNOWLEDGE", "LIBRARY", "MYSTERY", "PERFECT", "QUESTION", "SCIENCE", "SUCCESS", "THOUGHT", "TREASURE", "VICTORY", "WONDERFUL", "ABSOLUTE", "ACCIDENT", "ACTIVITY", "AMAZING", "ANYTHING", "AUDIENCE", "AUTHORITY", "AVAILABLE", "BACKGROUND", "BEHAVIOR", "BUSINESS", "CALENDAR", "CAPACITY", "CATEGORY", "CHEMICAL", "CHILDHOOD", "CHOCOLATE", "COMMUNITY", "COMPANY", "COMPETENT", "CONDITION", "CONSCIOUS", "CONSIDER", "CONSTANT", "LANGUAGE", "LEADER", "MACHINE", "MAGAZINE", "MANAGER", "MARKET"],
        count: 3,
        minLength: 6,
        maxLength: 9
    }
};

// Function to get a random selection of words based on difficulty
function getWordsForDifficulty(difficulty) {
    const selectedDifficulty = gameWords[difficulty];
    if (!selectedDifficulty) {
        console.error("Invalid difficulty:", difficulty);
        return []; // Return empty if difficulty not found
    }

    const availableWords = selectedDifficulty.words.filter(
        word => word.length >= selectedDifficulty.minLength && word.length <= selectedDifficulty.maxLength
    );

    // Shuffle the available words
    const shuffled = availableWords.sort(() => 0.5 - Math.random());

    // Get sub-array of first n elements after shuffling
    return shuffled.slice(0, selectedDifficulty.count);
} 