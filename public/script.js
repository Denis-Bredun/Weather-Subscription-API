document.addEventListener('DOMContentLoaded', () => {
  const weatherBtn = document.getElementById('weatherBtn');
  const weatherCity = document.getElementById('weatherCity');
  const weatherResult = document.getElementById('weatherResult');

  weatherResult.classList.add(
    'p-3',
    'rounded-md',
    'mt-2',
    'transition-all',
    'duration-300',
  );

  weatherBtn.addEventListener('click', async () => {
    const city = weatherCity.value.trim();
    weatherResult.textContent = '';
    weatherResult.className =
      'p-3 rounded-md mt-2 text-sm transition-all duration-300';

    if (!city) {
      weatherResult.textContent = '🌧️ Please enter a city name!';
      weatherResult.classList.add('bg-red-100', 'text-red-600');
      return;
    }

    weatherResult.innerHTML = `<span class="animate-pulse text-blue-600">🔄 Fetching weather data...</span>`;
    weatherResult.classList.add('bg-blue-50', 'text-blue-600');

    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      weatherResult.className =
        'p-3 rounded-md mt-2 text-sm bg-green-50 text-green-700 border border-green-200 shadow';
      weatherResult.innerHTML = `
        ☀️ <strong>Temperature:</strong> ${data.temperature}°C<br/>
        💧 <strong>Humidity:</strong> ${data.humidity}%<br/>
        🌈 <strong>Description:</strong> ${data.description}
      `;
    } catch (err) {
      weatherResult.className =
        'p-3 rounded-md mt-2 text-sm bg-red-100 text-red-700 border border-red-200 shadow';
      weatherResult.textContent =
        '❌ Failed to fetch weather data. Please try again later.';
    }
  });

  const form = document.querySelector('form[action="/api/subscribe"]');
  const formResult = document.createElement('div');
  formResult.className =
    'mt-4 p-3 rounded-md text-sm transition-all duration-300';
  form.appendChild(formResult);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formResult.textContent = '';
    formResult.className =
      'mt-4 p-3 rounded-md text-sm transition-all duration-300';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw result;

      formResult.className +=
        ' bg-green-100 text-green-800 border border-green-200 shadow';
      formResult.innerHTML = `🎉 <strong>${result.message ?? 'Subscription successful!'}</strong>`;
      form.reset();
    } catch (err) {
      formResult.className +=
        ' bg-red-100 text-red-800 border border-red-200 shadow';

      if (err.message) {
        formResult.innerHTML = `🚫 ${err.message}`;
      } else if (Array.isArray(err.message)) {
        formResult.innerHTML = `🚫 ${err.message.join(', ')}`;
      } else {
        formResult.innerHTML = '⚠️ Something went wrong. Please try again.';
      }
    }
  });
});
