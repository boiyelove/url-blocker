function goBack() {
  window.history.back();
}

document.addEventListener('DOMContentLoaded', () => {
  // Display the original blocked URL if passed as a query parameter
  const params = new URLSearchParams(window.location.search);
  const originalUrl = params.get('originalUrl');
  if (originalUrl) {
    const p = document.createElement('p');
    // Ensure the displayed URL is properly decoded and then re-encoded for safety in innerHTML, or use textContent.
    // For simplicity and assuming originalUrl is a full URL, decodeURIComponent is generally okay here.
    p.innerHTML = `Specifically, access to: <strong style="word-break: break-all;">${decodeURIComponent(originalUrl)}</strong> was blocked.`;
    const container = document.querySelector('.blocked-container');
    const goBackButton = container.querySelector('.back-button'); // The button itself is defined with onclick="goBack()"
    if (goBackButton) {
        container.insertBefore(p, goBackButton);
    } else {
        container.appendChild(p);
    }
  }

  // Add event listener for the go back button
  const goBackButtonElement = document.getElementById('goBackButton');
  if (goBackButtonElement) {
    goBackButtonElement.addEventListener('click', goBack);
  }
});
