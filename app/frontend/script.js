document.addEventListener('DOMContentLoaded', () => {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const themeToggle = document.getElementById('theme-toggle');
    const analyzeUrlBtn = document.getElementById('analyze-url-btn');
    const analyzeEmailBtn = document.getElementById('analyze-email-btn');
    const resultContainer = document.getElementById('result-container');
    const resultTitle = document.getElementById('result-title');
    const resultText = document.getElementById('result-text');
    const confidenceFill = document.getElementById('confidence-fill');
    const explanationText = document.getElementById('explanation-text');

    // Tab Switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.add('hidden'));

            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-tab`).classList.remove('hidden');
            resultContainer.classList.add('hidden');
        });
    });

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        const body = document.body;
        const isLight = body.getAttribute('data-theme') === 'light';
        body.setAttribute('data-theme', isLight ? 'dark' : 'light');
        themeToggle.innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    });

    // Analyze URL
    analyzeUrlBtn.addEventListener('click', async () => {
        const url = document.getElementById('url-input').value;
        if (!url) return alert('Please enter a URL');

        showLoading('Analyzing URL...');

        try {
            const response = await fetch('http://localhost:5000/predict/url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const data = await response.json();
            displayResult(data, 'url');
        } catch (error) {
            console.error(error);
            alert('Error connecting to backend API');
        }
    });

    // Analyze Email
    analyzeEmailBtn.addEventListener('click', async () => {
        const text = document.getElementById('email-input').value;
        if (!text) return alert('Please enter some text');

        showLoading('Analyzing Content...');

        try {
            const response = await fetch('http://localhost:5000/predict/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const data = await response.json();
            displayResult(data, 'email');
        } catch (error) {
            console.error(error);
            alert('Error connecting to backend API');
        }
    });

    function showLoading(msg) {
        resultContainer.classList.remove('hidden');
        resultTitle.innerText = msg;
        resultText.innerText = 'Our AI is scanning the features...';
        confidenceFill.style.width = '0%';
        explanationText.innerText = '';
    }

    function displayResult(data, type) {
        const isPhishing = data.prediction === 'phishing';
        const card = document.querySelector('.result-card');

        card.className = 'result-card ' + (isPhishing ? 'phishing' : 'legitimate');
        resultTitle.innerText = isPhishing ? 'Warning: Potential Phishing Detected!' : 'Secure: Looks Safe to me.';
        resultTitle.className = isPhishing ? 'phishing' : 'legitimate';

        const confidencePct = (data.confidence * 100).toFixed(1);
        resultText.innerText = `We are ${confidencePct}% confident in this analysis.`;

        confidenceFill.className = 'fill ' + (isPhishing ? 'phishing-fill' : 'legitimate-fill');
        setTimeout(() => {
            confidenceFill.style.width = `${confidencePct}%`;
        }, 100);

        // Simple explanation logic
        if (type === 'url') {
            const url = document.getElementById('url-input').value;
            let reasons = [];
            if (url.includes('@')) reasons.push('Contains unusual "@" symbol');
            if (url.length > 50) reasons.push('Unusually long URL');
            if (url.split('.').length > 3) reasons.push('Too many subdomains');

            explanationText.innerText = isPhishing
                ? `Our model identified patterns often found in fraudulent links, such as: ${reasons.join(', ') || 'suspicious character combinations'}.`
                : "The URL structure appears standard and doesn't match known malicious patterns.";
        } else {
            explanationText.innerText = isPhishing
                ? "The content contains linguistic patterns, urgency, or suspicious links typical of phishing attempts."
                : "The email content appears legitimate based on our textual analysis.";
        }
    }
});
