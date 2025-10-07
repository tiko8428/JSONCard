const slider = document.getElementById('slider');
const slides = document.querySelectorAll('.slide');
const startLessonBtn = document.querySelector('.start-lesson-btn');
const fixedLabel = document.querySelector('.slide-label-text');
const progressBarFill = document.querySelector('.progress-bar-fill');
const footer = document.querySelector('footer');
const feedbackMessage = document.querySelector('.feedback-message');

// Audio feedback
const correctSound = new Audio('sounds/correct.mp3');
const wrongSound = new Audio('sounds/error.mp3');

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
function updateSlider() {
    slides.forEach((slide, idx) => {
        slide.classList.toggle('active', idx === currentIndex);
    });

    const label = slides[currentIndex].dataset.label || 'LESSON';
    fixedLabel.textContent = label.toUpperCase();

    if (slides[currentIndex].dataset.type === 'dragdrop') {
        startLessonBtn.dataset.state = "check";
        updateButtonText("Check");
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
        slide.classList.remove('answered');

        answers.forEach(answer => {
            answer.addEventListener('click', () => {
                if (slide.classList.contains('answered')) return;
                slide.classList.add('answered');

                answers.forEach(a => a.classList.remove('selected', 'correct', 'wrong'));
                answer.classList.add('selected');

                const isCorrect = answer.dataset.correct === "true";
                const correctAnswer = slide.querySelector('.answer[data-correct="true"]');

                if (isCorrect) {
                    answer.classList.add('correct');
                    footer.classList.add('correct');
                    feedbackMessage.textContent = "✅ Excellent!";
                    styleFooterButton("#4CAF50");
                    playSound(correctSound);
                } 
                else {
                    answer.classList.add('wrong');
                    footer.classList.add('wrong');
                    feedbackMessage.innerHTML = `❌ Incorrect!<br>Correct Answer: <strong>${correctAnswer.textContent}</strong>`;
                    styleFooterButton("#F44336");
                    playSound(wrongSound);

                    answer.classList.add('shake');
                    answer.addEventListener('animationend', () => answer.classList.remove('shake'), { once: true });
                }
            });
        });
    });
}

/* -----------------------------
   DRAG/DROP SETUP
----------------------------- */

function setupClickToAnswerPractices() {
    const dragDropSlides = document.querySelectorAll('.slide[data-type="dragdrop"]');

    dragDropSlides.forEach(slide => {
        const words = slide.querySelectorAll('.word');
        const answerZone = slide.querySelector('.answer-zone');

        // Clear previous words in answer zone
        slide._resetWords = () => {
            words.forEach(word => slide.appendChild(word));
        };

        words.forEach(word => {
            word.style.cursor = 'pointer'; // indicate clickability

            word.addEventListener('click', () => {
                // Move clicked word to answer zone
                answerZone.appendChild(word);
            });
        });
    });
}


// function setupDragDropPractices() {
//     const dragDropSlides = document.querySelectorAll('.slide[data-type="dragdrop"]');

//     dragDropSlides.forEach(slide => {
//         const words = slide.querySelectorAll('.word');
//         const answerZone = slide.querySelector('.answer-zone');

//         const originalParents = new Map();
//         words.forEach(word => originalParents.set(word, word.parentElement));

//         words.forEach(word => {
//             let isDragging = false;
//             let offsetX = 0;
//             let offsetY = 0;

//             const startDrag = (x, y) => {
//                 const rect = word.getBoundingClientRect();
//                 offsetX = x - rect.left;
//                 offsetY = y - rect.top;

//                 isDragging = true;
//                 word.style.position = 'absolute';
//                 word.style.zIndex = 1000;
//                 word.style.width = `${rect.width}px`; // preserve width
//                 word.style.pointerEvents = 'none'; // prevent blocking pointer
//             };

//             const moveDrag = (x, y) => {
//                 if (!isDragging) return;
//                 word.style.left = `${x - offsetX}px`;
//                 word.style.top = `${y - offsetY}px`;
//             };

//             const endDrag = () => {
//                 if (!isDragging) return;
//                 isDragging = false;

//                 const wordRect = word.getBoundingClientRect();
//                 const answerRect = answerZone.getBoundingClientRect();

//                 if (
//                     wordRect.left + wordRect.width / 2 > answerRect.left &&
//                     wordRect.right - wordRect.width / 2 < answerRect.right &&
//                     wordRect.top + wordRect.height / 2 > answerRect.top &&
//                     wordRect.bottom - wordRect.height / 2 < answerRect.bottom
//                 ) {
//                     answerZone.appendChild(word);
//                 } else {
//                     const parent = originalParents.get(word);
//                     if (parent) parent.appendChild(word);
//                 }

//                 word.style.position = '';
//                 word.style.left = '';
//                 word.style.top = '';
//                 word.style.zIndex = '';
//                 word.style.width = '';
//                 word.style.pointerEvents = '';
//             };

//             // Desktop mouse
//             word.addEventListener('mousedown', e => {
//                 e.preventDefault();
//                 startDrag(e.clientX, e.clientY);

//                 const onMouseMove = e => moveDrag(e.clientX, e.clientY);
//                 const onMouseUp = e => {
//                     endDrag();
//                     document.removeEventListener('mousemove', onMouseMove);
//                     document.removeEventListener('mouseup', onMouseUp);
//                 };

//                 document.addEventListener('mousemove', onMouseMove);
//                 document.addEventListener('mouseup', onMouseUp);
//             });

//             // Mobile touch
//             word.addEventListener('touchstart', e => {
//                 e.preventDefault();
//                 const touch = e.touches[0];
//                 startDrag(touch.clientX, touch.clientY);
//             });

//             word.addEventListener('touchmove', e => {
//                 e.preventDefault();
//                 const touch = e.touches[0];
//                 moveDrag(touch.clientX, touch.clientY);
//             });

//             word.addEventListener('touchend', e => {
//                 e.preventDefault();
//                 endDrag();
//             });
//         });
//     });
// }



/* -----------------------------
   HELPERS
----------------------------- */
function styleFooterButton(color) {
    startLessonBtn.style.background = color;
    startLessonBtn.style.color = "#fff";
}

function playSound(audio) {
    audio.currentTime = 0;
    audio.play();
}

/* -----------------------------
   BUTTON CLICK HANDLING
----------------------------- */
startLessonBtn.addEventListener('click', () => {
    const currentSlide = slides[currentIndex];

    if (currentSlide.dataset.type === 'dragdrop') {
        const answerZone = currentSlide.querySelector('.answer-zone');
        const correctSentence = currentSlide.dataset.correctSentence?.trim();

        if (startLessonBtn.dataset.state === 'check') {
            const userSentence = Array.from(answerZone.querySelectorAll('.word'))
                .map(w => w.textContent.trim())
                .join(' ')
                .replace(/\s+/g, ' ')
                .toLowerCase();

            const normalizedCorrect = (correctSentence || "").replace(/\s+/g, ' ').toLowerCase();

            footer.classList.remove('correct', 'wrong');
            feedbackMessage.textContent = '';
            startLessonBtn.style.background = '';
            startLessonBtn.style.color = '';

            if (userSentence === normalizedCorrect) {
                footer.classList.add('correct');
                feedbackMessage.textContent = "✅ Well done!";
                styleFooterButton("#4CAF50");
                playSound(correctSound);
                startLessonBtn.dataset.state = 'next';
                updateButtonText("Next");
            } else {
                footer.classList.add('wrong');
                feedbackMessage.innerHTML = `❌ Wrong!<br>Try again!`;
                styleFooterButton("#F44336");
                playSound(wrongSound);

                answerZone.classList.add('shake');
                answerZone.addEventListener('animationend', () => answerZone.classList.remove('shake'), { once: true });

                if (typeof currentSlide._resetWords === 'function') currentSlide._resetWords();
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

    if (currentIndex < slides.length - 1) {
        currentIndex++;
        updateSlider();
    } else {
        console.log("Lesson finished ✅");
    }
});

/* -----------------------------
   INIT
----------------------------- */
updateSlider();
setupPracticeAnswers();
// setupDragDropPractices();
setupClickToAnswerPractices();