        let state = {
            expr: '',
            lastRes: null,
            history: []
        };

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        function playTick() {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.05);
        }

        function handle(val) {
            playTick();
            const lastChar = state.expr.slice(-1);
            const ops = ['+', '-', '*', '/'];

            if (val === 'AC') {
                state.expr = '';
            } else if (val === 'DEL') {
                state.expr = state.expr.slice(0, -1);
            } else if (val === '=') {
                calculate();
                return;
            } else if (ops.includes(val)) {
                // बग फिक्स: लगातार दो ऑपरेटर होने पर पिछला बदलें
                if (ops.includes(lastChar)) {
                    state.expr = state.expr.slice(0, -1) + val;
                } else if (state.expr !== '' || val === '-') {
                    state.expr += val;
                }
            } else if (val === '.') {
                // बग फिक्स: एक नंबर में दो डेसीमल रोकना
                const parts = state.expr.split(/[\+\-\*\/]/);
                const currentNum = parts[parts.length - 1];
                if (!currentNum.includes('.')) {
                    state.expr += '.';
                }
            } else {
                // अगर पिछली बार '=' दबाया था और अब नंबर दबाया तो नया शुरू करें
                if (state.lastRes !== null) {
                    state.expr = val;
                    state.lastRes = null;
                } else {
                    state.expr += val;
                }
            }
            updateUI();
        }

        function calculate() {
            try {
                if (!state.expr) return;

                // बग फिक्स: अनबैलेंस ब्रैकेट फिक्स करें
                let openB = (state.expr.match(/\(/g) || []).length;
                let closeB = (state.expr.match(/\)/g) || []).length;
                let finalExpr = state.expr + ')'.repeat(Math.max(0, openB - closeB));

                // इवैल्यूएशन
                let result = eval(finalExpr);
                
                // शुद्धता फिक्स
                if (!Number.isInteger(result)) {
                    result = parseFloat(result.toFixed(8));
                }

                // हिस्ट्री अपडेट
                state.history.unshift({ q: state.expr, a: result });
                if (state.history.length > 10) state.history.pop();
                renderHistory();

                document.getElementById('exp-view').innerText = state.expr + ' =';
                state.expr = result.toString();
                state.lastRes = result;
                updateUI();
            } catch (e) {
                document.getElementById('main-view').innerText = "Error";
                setTimeout(() => { state.expr = ''; updateUI(); }, 1000);
            }
        }

        function updateUI() {
            const main = document.getElementById('main-view');
            const exp = document.getElementById('exp-view');
            
            main.innerText = state.expr || '0';
            if (state.lastRes === null) exp.innerText = state.expr.replace(/\*/g, '×').replace(/\//g, '÷');
            
            // फोंट साइज को टेक्स्ट की लंबाई के हिसाब से एडजस्ट करें
            if (main.innerText.length > 9) main.style.fontSize = '1.5rem';
            else main.style.fontSize = '2.2rem';
        }

        function toggleHistory() {
            document.getElementById('history-panel').classList.toggle('open');
        }

        function renderHistory() {
            const list = document.getElementById('history-items');
            if (state.history.length === 0) {
                list.innerHTML = '<div class="text-center text-slate-400 text-sm mt-10">कोई रिकॉर्ड नहीं</div>';
                return;
            }
            list.innerHTML = state.history.map(h => `
                <div class="history-item">
                    <div class="text-[10px] text-slate-400">${h.q}</div>
                    <div class="font-bold text-blue-500">${h.a}</div>
                </div>
            `).join('');
        }

        function clearHistory() {
            state.history = [];
            renderHistory();
        }