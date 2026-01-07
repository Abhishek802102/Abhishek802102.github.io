window.addEventListener('load', function() {
    
    // सुरक्षा जांच: अगर लाइब्रेरी लोड नहीं हुई तो अलर्ट देगा
    if (!window.jspdf) {
        alert("Error: jsPDF लाइब्रेरी लोड नहीं हो पाई। इंटरनेट कनेक्शन चेक करें और पेज रिफ्रेश करें।");
        return;
    }

    // लाइब्रेरी लोड होने के बाद ही इसे वेरिएबल में डालें
    const { jsPDF } = window.jspdf;

    // आपके सारे एलिमेंट्स
    const fileInput = document.getElementById('fileInput');
    const pickBtn = document.getElementById('pickBtn');
    const drop = document.getElementById('drop');
    const thumbs = document.getElementById('thumbs');
    const clearBtn = document.getElementById('clearBtn');
    const convertBtn = document.getElementById('convertBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const progressWrap = document.getElementById('progressWrap');
    const progressText = document.getElementById('progressText');

    const pageSizeEl = document.getElementById('pageSize');
    const customSizeRow = document.getElementById('customSizeRow');
    const customW = document.getElementById('customW');
    const customH = document.getElementById('customH');
    const orientationEl = document.getElementById('orientation');
    const fitModeEl = document.getElementById('fitMode');
    const marginEl = document.getElementById('margin');
    const qualityEl = document.getElementById('quality');
    const outNameEl = document.getElementById('outName');

    let images = [];

    // Helper Functions
    function humanSize(n) {
        if (n < 1024) return n + ' B';
        if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
        return (n / 1024 / 1024).toFixed(2) + ' MB';
    }

    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // Image Adding Logic
    function addFiles(files) {
        const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (arr.length === 0) return;
        arr.forEach(file => {
            const reader = new FileReader();
            reader.onload = e => {
                images.push({ file, dataUrl: e.target.result, name: file.name, size: file.size });
                renderThumbs();
            };
            reader.readAsDataURL(file);
        });
    }

    function renderThumbs() {
        thumbs.innerHTML = '';
        images.forEach((img, idx) => {
            const d = document.createElement('div');
            d.className = 'thumb';
            d.innerHTML = `
            <img src="${img.dataUrl}" alt="${img.name}" />
            <div class="meta">
              <div class="name">${idx+1}. ${escapeHtml(img.name)}</div>
              <div class="size">${humanSize(img.size)}</div>
            </div>
            <div class="actions">
              <button class="icon-btn" data-action="up">⬆</button>
              <button class="icon-btn" data-action="down">⬇</button>
              <button class="icon-btn" data-action="remove">✖</button>
            </div>`;
            
            d.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.getAttribute('data-action');
                    if (action === 'remove') { images.splice(idx, 1); }
                    else if (action === 'up' && idx > 0) { const temp = images[idx]; images[idx] = images[idx-1]; images[idx-1] = temp; }
                    else if (action === 'down' && idx < images.length - 1) { const temp = images[idx]; images[idx] = images[idx+1]; images[idx+1] = temp; }
                    renderThumbs();
                });
            });
            thumbs.appendChild(d);
        });
    }

    // Listeners
    if(pickBtn) pickBtn.addEventListener('click', () => fileInput.click());
    if(fileInput) fileInput.addEventListener('change', () => addFiles(fileInput.files));
    
    if(drop) {
        ['dragenter', 'dragover'].forEach(evt => drop.addEventListener(evt, e => { e.preventDefault(); drop.classList.add('dragover'); }));
        ['dragleave', 'drop'].forEach(evt => drop.addEventListener(evt, e => { e.preventDefault(); drop.classList.remove('dragover'); }));
        drop.addEventListener('drop', e => { if (e.dataTransfer.files) addFiles(e.dataTransfer.files); });
    }

    if(clearBtn) clearBtn.addEventListener('click', () => { if (confirm('Clear all?')) { images = []; renderThumbs(); } });

    if(pageSizeEl) pageSizeEl.addEventListener('change', () => {
        customSizeRow.style.display = pageSizeEl.value === 'custom' ? 'block' : 'none';
    });

    // PDF Conversion Logic
    async function convertAndDownload() {
        if (images.length === 0) { alert('Please upload images first!'); return; }
        
        progressWrap.style.display = 'block';
        progressText.textContent = 'Starting...';

        // Wait a tiny bit to let UI update
        await new Promise(r => setTimeout(r, 10));

        let pageW = 210, pageH = 297;
        if (pageSizeEl.value === 'letter') { pageW = 216; pageH = 279; }
        else if (pageSizeEl.value === 'custom') { 
            pageW = parseFloat(customW.value) || 210; 
            pageH = parseFloat(customH.value) || 297; 
        }

        const orient = orientationEl.value;
        const pdf = new jsPDF({ unit: 'mm', format: [pageW, pageH], orientation: orient });
        
        const finalW = (orient === 'portrait') ? pageW : pageH;
        const finalH = (orient === 'portrait') ? pageH : pageW;
        const margin = parseFloat(marginEl.value) || 0;
        const fit = fitModeEl.value;
        const quality = parseFloat(qualityEl.value) || 0.75;

        for (let i = 0; i < images.length; i++) {
            progressText.textContent = `Processing image ${i+1} / ${images.length}`;
            
            const imgEl = await loadImage(images[i].dataUrl);
            const availW = finalW - (2 * margin);
            const availH = finalH - (2 * margin);
            
            // Calculate dimensions
            let drawW = availW, drawH = availH;
            const imgRatio = imgEl.naturalWidth / imgEl.naturalHeight;
            const pageRatio = availW / availH;

            if (fit === 'contain') {
                if (imgRatio > pageRatio) { drawH = availW / imgRatio; } 
                else { drawW = availH * imgRatio; }
            } else { // cover
                if (imgRatio > pageRatio) { drawW = availH * imgRatio; } 
                else { drawH = availW / imgRatio; }
            }

            const x = margin + (availW - drawW) / 2;
            const y = margin + (availH - drawH) / 2;

            // Convert to JPEG for compression
            const jpegData = await toJpeg(imgEl, quality);

            if (i > 0) pdf.addPage([pageW, pageH], orient);
            pdf.addImage(jpegData, 'JPEG', x, y, drawW, drawH);
        }

        progressText.textContent = 'Saving PDF...';
        pdf.save(outNameEl.value || 'download.pdf');
        progressWrap.style.display = 'none';
    }

    function loadImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = url;
        });
    }

    function toJpeg(img, q) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF'; // Remove transparency
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', q));
        });
    }

    if(convertBtn) convertBtn.addEventListener('click', convertAndDownload);
    if(downloadBtn) downloadBtn.addEventListener('click', convertAndDownload);

});
