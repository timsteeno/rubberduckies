let flashcards = [];
let currentGame = [];
let currentQuestionIndex = 0;
let gameStartTime;
let questionStartTime;
let correctCards = 0;

async function loadFlashcards() {
    const response = await fetch('flashcards.json');
    flashcards = await response.json();
}

function startGame() {
    currentGame = getRandomFlashcards(10);
    currentQuestionIndex = 0;
    correctCards = 0;
    gameStartTime = Date.now();

    document.getElementById('end-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';

    updateProgressBar();
    clearCardStack();
    showQuestion();
}

function getRandomFlashcards(count) {
    return flashcards.sort(() => 0.5 - Math.random()).slice(0, count);
}

function showQuestion() {
    const flashcard = currentGame[currentQuestionIndex];
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    katex.render(flashcard.question, document.getElementById('question'), {
        throwOnError: false,
        displayMode: true,
        fontSize: 24
    });
    document.getElementById('answer-input').value = '';
    questionStartTime = Date.now();
    document.getElementById('flashcard').className = '';
}

function submitAnswer() {
    const userAnswer = document.getElementById('answer-input').value.trim();
    const flashcard = currentGame[currentQuestionIndex];
    const timeTaken = (Date.now() - questionStartTime) / 1000;

    const isCorrect = checkAnswer(userAnswer, flashcard.answer);
    flashcard.isCorrect = isCorrect; // Add this line to store the correctness
    updateFlashcardStats(flashcard, isCorrect, timeTaken);
    showFeedback(isCorrect, flashcard);
 
    currentQuestionIndex++;

    if (currentQuestionIndex < currentGame.length) {
        updateProgressBar();
        setTimeout(showQuestion, 1000);
    } else {
        setTimeout(endGame, 1000);
    }
}

function checkAnswer(userAnswer, correctAnswer) {
    const cleanUserAnswer = userAnswer.replace(/\\frac{(\d+)}{(\d+)}/g, '$1/$2').replace(/\s/g, '');
    const cleanCorrectAnswer = correctAnswer.replace(/\\frac{(\d+)}{(\d+)}/g, '$1/$2').replace(/\s/g, '');
    return eval(cleanUserAnswer) === eval(cleanCorrectAnswer);
}

function updateFlashcardStats(flashcard, isCorrect, timeTaken) {
    flashcard.timesAsked = (flashcard.timesAsked || 0) + 1;
    flashcard.timesCorrect = (flashcard.timesCorrect || 0) + (isCorrect ? 1 : 0);
    flashcard.totalTime = (flashcard.totalTime || 0) + timeTaken;
    localStorage.setItem('flashcardStats', JSON.stringify(flashcards));
}

function showFeedback(isCorrect, flashcard) {
    const feedbackCard = document.getElementById('flashcard');
    feedbackCard.classList.add(isCorrect ? 'correct' : 'incorrect');
    
    if (isCorrect) {
        feedbackCard.classList.add('card-shrink-move');
        correctCards++;
        setTimeout(() => addToCardStack(flashcard), 300);
    } else {
        feedbackCard.classList.add('card-shake');
    }
}

function addToCardStack(flashcard) {
    const stackCard = document.createElement('div');
    stackCard.className = 'stack-card';
    
    const equationDiv = document.createElement('div');
    equationDiv.className = 'equation';
    katex.render(flashcard.question, equationDiv, { throwOnError: false });
    
    const answerDiv = document.createElement('div');
    answerDiv.className = 'answer';
    katex.render(flashcard.answer, answerDiv, { throwOnError: false });
    
    stackCard.appendChild(equationDiv);
    stackCard.appendChild(answerDiv);
    
    const cardStack = document.getElementById('card-stack');
    cardStack.insertBefore(stackCard, cardStack.firstChild);
    
    if (cardStack.children.length > 10) {
        cardStack.removeChild(cardStack.lastChild);
    }
    
    // Adjust positions of cards in the stack
    Array.from(cardStack.children).forEach((card, index) => {
        card.style.top = `${index * 30}px`;
        card.style.zIndex = 10 - index;
    });
}

function clearCardStack() {
    document.getElementById('card-stack').innerHTML = '';
}

function updateProgressBar() {
    const progressFill = document.getElementById('progress-fill');
    const progress = (currentQuestionIndex / currentGame.length) * 100;
    progressFill.style.width = `${progress}%`;
}

function calculateScore() {
    return Math.round((correctCards / currentGame.length) * 100);
}

function endGame() {
    const score = calculateScore();
    document.getElementById('final-score').textContent = `${score}%`;
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('end-screen').style.display = 'block';
    displayFinalCards();
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}

function displayFinalCards() {
    const finalCardsGrid = document.getElementById('final-cards-grid');
    finalCardsGrid.innerHTML = '';

    currentGame.forEach((flashcard, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'final-card';
        if (!flashcard.isCorrect) {
            cardElement.classList.add('incorrect');
        }

        const questionDiv = document.createElement('div');
        questionDiv.className = 'final-card-question';
        katex.render(flashcard.question, questionDiv, { throwOnError: false });

        const answerDiv = document.createElement('div');
        answerDiv.className = 'final-card-answer';
        katex.render(flashcard.answer, answerDiv, { throwOnError: false });

        cardElement.appendChild(questionDiv);
        cardElement.appendChild(answerDiv);

        finalCardsGrid.appendChild(cardElement);
    });
}

document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('submit-answer').addEventListener('click', submitAnswer);
document.getElementById('play-again').addEventListener('click', startGame);
document.getElementById('answer-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitAnswer();
});

loadFlashcards();