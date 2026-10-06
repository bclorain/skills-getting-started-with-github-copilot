document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsHeading = document.createElement("h5");
        participantsHeading.className = "participants-heading";
        participantsHeading.textContent = "Participants";

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";
        details.participants.forEach((participant) => {
          const participantItem = document.createElement("li");
          const participantEmail = document.createElement("span");
          participantEmail.className = "participant-email";
          participantEmail.textContent = participant;

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "remove-participant-button";
          removeButton.setAttribute("aria-label", `Unregister ${participant}`);
          removeButton.title = "Unregister participant";

          const removeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          removeIcon.setAttribute("viewBox", "0 0 24 24");
          removeIcon.setAttribute("aria-hidden", "true");
          const removeIconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
          removeIconPath.setAttribute("d", "M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6");
          removeIcon.appendChild(removeIconPath);
          removeButton.appendChild(removeIcon);

          removeButton.addEventListener("click", async () => {
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(participant)}`,
                { method: "DELETE" }
              );
              const result = await response.json();

              if (!response.ok) {
                throw new Error(result.detail || "Unable to unregister participant");
              }

              await fetchActivities();
            } catch (error) {
              messageDiv.textContent = error.message || "Failed to unregister participant. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              console.error("Error unregistering participant:", error);
            }
          });

          participantItem.append(participantEmail, removeButton);
          participantsList.appendChild(participantItem);
        });

        activityCard.append(participantsHeading, participantsList);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
