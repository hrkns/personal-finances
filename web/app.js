const placeholder = document.getElementById("placeholder");

placeholder.textContent = "Frontend is working ✅";

fetch("/api/health")
  .then((response) => response.json())
  .then((data) => {
    placeholder.textContent = `Frontend is working ✅ | Backend: ${data.message}`;
  })
  .catch(() => {
    placeholder.textContent = "Frontend is working ✅ | Backend check failed";
  });