// =============================================
// TEST YOUR MIND — Test Engine
// SOULCAKEY | 2025
// =============================================

class TestEngine {
    constructor(testData) {
        this.test = testData;
        this.questions = testData.questions;
        this.currentQ = 0;
        this.answers = new Array(this.questions.length).fill(null);
        this.container = document.querySelector('.test-play-container');
    }

    init() {
        this.render();
    }

    render() {
        const q = this.questions[this.currentQ];
        const progress = ((this.currentQ) / this.questions.length) * 100;
        const isLast = this.currentQ === this.questions.length - 1;
        const selected = this.answers[this.currentQ];

        this.container.innerHTML = `
      <div class="test-progress-bar-track">
        <div class="test-progress-bar-fill" style="width:${progress}%"></div>
      </div>
      <div class="test-question-num animate-fade-in">Question ${this.currentQ + 1} of ${this.questions.length}</div>
      <div class="test-question-text animate-fade-up">${q.text}</div>
      <div class="test-options">
        ${q.options.map((opt, i) => `
          <button class="test-option ${selected === i ? 'selected' : ''}" data-index="${i}">
            <div class="test-option-letter">${opt.label}</div>
            <span>${opt.text}</span>
          </button>
        `).join('')}
      </div>
      <div class="test-nav-btns">
        <button class="btn btn-secondary" id="prevBtn" ${this.currentQ === 0 ? 'style="visibility:hidden"' : ''}>← Back</button>
        <span style="font-size:0.88rem;color:var(--color-text-muted)">${this.currentQ + 1} / ${this.questions.length}</span>
        <button class="btn btn-primary" id="nextBtn" ${selected === null ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''}>
          ${isLast ? 'See My Result 🎉' : 'Next →'}
        </button>
      </div>
    `;

        // Bind option clicks
        this.container.querySelectorAll('.test-option').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectAnswer(parseInt(btn.dataset.index));
            });
        });

        document.getElementById('prevBtn')?.addEventListener('click', () => this.prev());
        document.getElementById('nextBtn')?.addEventListener('click', () => this.next());
    }

    selectAnswer(index) {
        this.answers[this.currentQ] = index;
        this.render();
    }

    next() {
        if (this.answers[this.currentQ] === null) return;
        if (this.currentQ < this.questions.length - 1) {
            this.currentQ++;
            this.render();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            this.showResult();
        }
    }

    prev() {
        if (this.currentQ > 0) {
            this.currentQ--;
            this.render();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    calculateResult() {
        const scores = {};
        this.questions.forEach((q, qi) => {
            const answerIndex = this.answers[qi];
            if (answerIndex === null) return;
            const opt = q.options[answerIndex];
            if (!opt.score) return;
            Object.entries(opt.score).forEach(([key, val]) => {
                scores[key] = (scores[key] || 0) + val;
            });
        });
        // Find highest scoring result type
        const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
        return winner ? winner[0] : Object.keys(this.test.results)[0];
    }

    showResult() {
        const resultKey = this.calculateResult();
        const testId = this.test.slug;
        // Save to sessionStorage for result page
        sessionStorage.setItem('tym_result_key', resultKey);
        sessionStorage.setItem('tym_result_test', testId);
        window.location.href = `test-result.html?id=${testId}&result=${resultKey}`;
    }
}
