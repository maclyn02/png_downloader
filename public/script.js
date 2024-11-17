let adsWatched = 0;

async function watchAd() {
    try {
        const response = await fetch('/ad-viewed', {
            method: 'POST'
        });
        if (response.ok) {
            adsWatched++;
            document.getElementById('adCount').textContent = adsWatched;
        }
    } catch (error) {
        console.error('Error recording ad view:', error);
    }
}

async function checkDownload() {
    try {
        const response = await fetch('/download');
        if (response.ok) {
            // Trigger download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'image.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else {
            const data = await response.json();
            alert(data.error || 'Please watch more ads before downloading');
        }
    } catch (error) {
        console.error('Error downloading:', error);
        alert('Error downloading file');
    }
}