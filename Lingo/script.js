const slider = document.getElementById('slider');
const slides = document.querySelectorAll('.slide');
const startLessonBtn = document.querySelector('.start-lesson-btn');
const fixedLabel = document.querySelector('.slide-label-text');
const progressBarFill = document.querySelector('.progress-bar-fill');
const footer = document.querySelector('footer');
const feedbackMessage = document.querySelector('.feedback-message');

// Audio feedback
// const correctSound = new Audio('sounds/correct.mp3');
// const wrongSound = new Audio('sounds/error.mp3');

const correctSound = new Audio('http://firebasestorage.googleapis.com/v0/b/cards-6f8a3.appspot.com/o/WebContent%2FCorrect.mp3?alt=media&token=e11ef4ef-c020-431f-a87c-9e57bddc343c');
const wrongSound = new Audio('https://firebasestorage.googleapis.com/v0/b/cards-6f8a3.appspot.com/o/WebContent%2FError.mp3?alt=media&token=5d61b9e3-8db2-483f-9526-86f8f797e3a9');

let currentIndex = 0;

/* -----------------------------
   BUTTON TEXT HELPER
----------------------------- */
function updateButtonText(text) {
    const icon = startLessonBtn.querySelector('.btn-icon');
    startLessonBtn.textContent = '';
    startLessonBtn.append(text);
    if (icon) startLessonBtn.appendChild(icon);
}

/* -----------------------------
   PROGRESS BAR
----------------------------- */
function updateProgress() {
    if (!progressBarFill) return;
    const totalSteps = Math.max(1, slides.length - 1);
    const pct = (currentIndex / totalSteps) * 100;

    progressBarFill.style.width = `${pct}%`;
    progressBarFill.setAttribute('role', 'progressbar');
    progressBarFill.setAttribute('aria-valuemin', '0');
    progressBarFill.setAttribute('aria-valuemax', '100');
    progressBarFill.setAttribute('aria-valuenow', String(Math.round(pct)));
    progressBarFill.setAttribute('aria-valuetext', `${Math.round(pct)}%`);
}

/* -----------------------------
   SLIDER UPDATE
----------------------------- */
function isMultipleChoiceSlide(slide) {
    return slide?.dataset.label === 'practice' && slide.dataset.type !== 'dragdrop';
}

function resetMultipleChoiceSlide(slide) {
    if (!slide) return;
    const answers = slide.querySelectorAll('.answer');
    answers.forEach(answer => answer.classList.remove('selected', 'correct', 'wrong'));
    slide.dataset.locked = 'false';
}

function updateSlider() {
    slides.forEach((slide, idx) => {
        slide.classList.toggle('active', idx === currentIndex);
    });

    const currentSlide = slides[currentIndex];
    const label = currentSlide.dataset.label || 'LESSON';
    fixedLabel.textContent = label.toUpperCase();

    if (currentSlide.dataset.type === 'dragdrop' || isMultipleChoiceSlide(currentSlide)) {
        startLessonBtn.dataset.state = "check";
        updateButtonText("Check");
        if (isMultipleChoiceSlide(currentSlide)) {
            resetMultipleChoiceSlide(currentSlide);
        }
    } else if (currentIndex === 0) {
        updateButtonText("Start Lesson");
    } else if (currentIndex === slides.length - 1) {
        updateButtonText("Finish");
    } else {
        updateButtonText("Next");
    }

    footer.classList.remove('correct', 'wrong');
    feedbackMessage.textContent = '';
    startLessonBtn.style.background = '';
    startLessonBtn.style.color = '';

    updateProgress();
}

/* -----------------------------
   GO TO SLIDE
----------------------------- */
function goToSlide(index) {
    if (index < 0 || index >= slides.length) return;
    currentIndex = index;
    updateSlider();
}

/* -----------------------------
   MULTIPLE-CHOICE SETUP
----------------------------- */
function setupPracticeAnswers() {
    const practiceSlides = document.querySelectorAll('.slide[data-label="practice"]:not([data-type="dragdrop"])');

    practiceSlides.forEach(slide => {
        const answers = slide.querySelectorAll('.answer');
        slide.dataset.locked = 'false';

        answers.forEach(answer => {
            answer.addEventListener('click', () => {
                if (slide.dataset.locked === 'true') return;

                answers.forEach(a => a.classList.remove('selected'));
                answer.classList.add('selected');
            });
        });
    });
}

// Prevent zoom on Ctrl + wheel (trackpad pinch)
window.addEventListener('wheel', function (e) {
    if (e.ctrlKey) {
        e.preventDefault();
    }
}, { passive: false });

// Optional: prevent pinch gesture on touch devices
window.addEventListener('gesturestart', function (e) {
    e.preventDefault();
});

/* -----------------------------
   DRAG/DROP SETUP
----------------------------- */
function setupClickToAnswerPractices() {
    const dragDropSlides = document.querySelectorAll('.slide[data-type="dragdrop"]');

    dragDropSlides.forEach(slide => {
        const words = slide.querySelectorAll('.word');
        const answerZone = slide.querySelector('.answer-zone');

        // Save original order
        const originalOrder = Array.from(words);

        // Reset function (keep order, clear answer zone)
        slide._resetWords = () => {
            answerZone.innerHTML = '';
            originalOrder.forEach(word => {
                word.classList.remove('selected-in-zone', 'correct', 'wrong');
                word.style.display = ''; // show again
            });
        };

        words.forEach(word => {
            word.style.cursor = 'pointer';

            word.addEventListener('click', () => {
                // Check if word is already in answer zone
                const inAnswer = word.classList.contains('selected-in-zone');

                if (!inAnswer) {
                    // Move to answer zone
                    const clone = word.cloneNode(true);
                    clone.addEventListener('click', () => {
                        clone.remove();
                        word.style.display = '';
                        word.classList.remove('selected-in-zone');
                    });
                    answerZone.appendChild(clone);

                    word.classList.add('selected-in-zone');
                    word.style.display = 'none';
                }
            });
        });
    });
}

/* -----------------------------
   HELPERS
----------------------------- */
function styleFooterButton(color) {
    startLessonBtn.style.background = color;
    startLessonBtn.style.color = "#fff";
}

function playSound(audio) {
    if (!audioUnlocked) return;
    audio.currentTime = 0;
    audio.play().catch(() => { });
}

/* -----------------------------
   BUTTON CLICK HANDLING
----------------------------- */
startLessonBtn.addEventListener('click', () => {
    const currentSlide = slides[currentIndex];

    if (isMultipleChoiceSlide(currentSlide)) {
        const answers = currentSlide.querySelectorAll('.answer');
        const selected = currentSlide.querySelector('.answer.selected');

        if (startLessonBtn.dataset.state === 'check') {
            if (!selected) {
                feedbackMessage.textContent = "Please select an answer before checking.";
                footer.classList.remove('correct', 'wrong');
                startLessonBtn.style.background = '';
                startLessonBtn.style.color = '';
                return;
            }

            const isCorrect = selected.dataset.correct === "true";
            const correctAnswer = currentSlide.querySelector('.answer[data-correct="true"]');

            answers.forEach(answer => answer.classList.remove('correct', 'wrong', 'shake'));
            footer.classList.remove('correct', 'wrong');

            if (isCorrect) {
                selected.classList.add('correct');
                footer.classList.add('correct');
                feedbackMessage.textContent = "✅ Excellent!";
                styleFooterButton("#4CAF50");
                playSound(correctSound);
            } else {
                selected.classList.add('wrong');
                if (correctAnswer) {
                    correctAnswer.classList.add('correct');
                }
                footer.classList.add('wrong');
                feedbackMessage.innerHTML = `❌ Incorrect!<br>Correct Answer: <strong>${correctAnswer?.textContent || ''}</strong>`;
                styleFooterButton("#F44336");
                playSound(wrongSound);

                selected.classList.add('shake');
                selected.addEventListener('animationend', () => selected.classList.remove('shake'), { once: true });
            }

            currentSlide.dataset.locked = 'true';
            startLessonBtn.dataset.state = 'next';
            updateButtonText("Next");
            return;
        }

        if (startLessonBtn.dataset.state === 'next') {
            if (currentIndex < slides.length - 1) {
                currentIndex++;
                updateSlider();
            } else {
                console.log("Lesson finished ✅");
            }
        }

        return;
    }

    if (currentSlide.dataset.type === 'dragdrop') {
        const answerZone = currentSlide.querySelector('.answer-zone');
        const correctSentence = currentSlide.dataset.correctSentence?.trim();

        if (startLessonBtn.dataset.state === 'check') {
            function normalizeAnswer(str) {
                return str
                    .replace(/[.,!?]/g, '')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .toLowerCase();
            }

            // ✅ FIXED: read words individually in order
            const userAnswer = Array.from(answerZone.children)
                .map(child => child.textContent.trim())
                .join(' ');

            const normalizedUserAnswer = normalizeAnswer(userAnswer);
            const normalizedCorrect = normalizeAnswer(correctSentence);

            if (normalizedUserAnswer === normalizedCorrect && normalizedUserAnswer !== "") {
                // ✅ Correct
                footer.classList.add('correct');
                feedbackMessage.textContent = "✅ Well done!";
                styleFooterButton("#4CAF50");
                playSound(correctSound);
                startLessonBtn.dataset.state = 'next';
                updateButtonText("Next");
            } else {
                // ❌ Wrong
                footer.classList.add('wrong');
                styleFooterButton("#F44336");
                playSound(wrongSound);

                // Show correct answer
                answerZone.innerHTML = '';
                correctSentence.split(' ').forEach(wordText => {
                    const w = document.createElement('div');
                    w.textContent = wordText;
                    w.classList.add('word', 'correct');
                    answerZone.appendChild(w);
                });

                feedbackMessage.innerHTML = `❌ Incorrect!<br>Correct Answer: <strong>${correctSentence}</strong>`;
                startLessonBtn.dataset.state = 'next';
                updateButtonText("Next");
            }
            return;
        }

        if (startLessonBtn.dataset.state === 'next') {
            if (currentIndex < slides.length - 1) {
                currentIndex++;
                updateSlider();
            } else {
                console.log("Lesson finished ✅");
            }
            return;
        }
    }

    // Normal navigation for non-dragdrop slides
    if (currentIndex < slides.length - 1) {
        currentIndex++;
        updateSlider();
    } else {
        console.log("Lesson finished ✅");
    }
});

// Audio unlock for iOS WebView
let audioUnlocked = false;
function unlockAudio() {
    if (audioUnlocked) return;

    correctSound.play().catch(() => { });
    wrongSound.play().catch(() => { });
    correctSound.pause();
    correctSound.currentTime = 0;
    wrongSound.pause();
    wrongSound.currentTime = 0;

    audioUnlocked = true;
}

// Listen for first tap anywhere
document.body.addEventListener('click', unlockAudio, { once: true });

/* -----------------------------
   INIT
----------------------------- */
updateSlider();
setupPracticeAnswers();
setupClickToAnswerPractices();
