document.addEventListener('DOMContentLoaded', () => {
    const wordElement = document.getElementById('japanese-word');
    const definitionElement = document.getElementById('word-definition');
    const exampleJapaneseElement = document.getElementById('example-japanese');
    const exampleRomajiElement = document.getElementById('example-romaji');
    const exampleTranslationElement = document.getElementById('example-translation');

    const LOCAL_STORAGE_KEY = 'dailyJapaneseWordData';

    /**
     * Gets today's date as a string in YYYY-MM-DD format.
     * @returns {string} Today's date.
     */
    function getTodaysDateString() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    /**
     * Selects a word for the day. Tries to retrieve from localStorage first.
     * If not found for today, picks a new random word and stores it.
     * @param {Array<Object>} words - The array of word objects.
     * @returns {Object} The selected word object for the day.
     */
    function getDailyWord(words) {
        const todaysDateStr = getTodaysDateString();
        let wordIndex;

        try {
            const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedData) {
                const { date: storedDate, index: storedIndex } = JSON.parse(storedData);
                if (storedDate === todaysDateStr && storedIndex >= 0 && storedIndex < words.length) {
                    wordIndex = storedIndex; // Use the stored index if it's for today and valid
                }
            }
        } catch (e) {
            console.warn('Could not access localStorage for daily word. A new word will be picked for this session.', e);
        }

        if (wordIndex === undefined) { // No valid word stored for today, or localStorage access failed
            wordIndex = Math.floor(Math.random() * words.length);
            try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ date: todaysDateStr, index: wordIndex }));
            } catch (e) {
                console.warn('Could not save daily word to localStorage.', e);
            }
        }
        return words[wordIndex];
    }

    fetch('data/words.json') 
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(words => {
            if (words && words.length > 0) {
                const currentWord = getDailyWord(words);
                
                wordElement.textContent = `${currentWord.word_ja} (${currentWord.reading} - ${currentWord.romaji})`;
                definitionElement.textContent = currentWord.definition_en;
                
                exampleJapaneseElement.textContent = currentWord.example_ja;
                exampleRomajiElement.textContent = currentWord.example_romaji;
                exampleTranslationElement.textContent = currentWord.example_translation_en;

            } else {
                wordElement.textContent = 'No words available.';
                console.error('Word list is empty or not loaded.');
            }
        })
        .catch(error => {
            console.error('Error fetching or processing words:', error);
            wordElement.textContent = 'Failed to load word.';
        });
});