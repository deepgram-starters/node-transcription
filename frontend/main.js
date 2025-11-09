/**
 * Transcription HTML Starter - Frontend Application
 *
 * This is a vanilla JavaScript frontend that provides a transcription UI
 * for Deepgram's Speech-to-Text service. It's designed to be easily
 * modified and extended for your own projects.
 *
 * Key Features:
 * - Audio source selection (URLs or file upload)
 * - Model selection
 * - Real-time transcription
 * - History management with localStorage
 * - Responsive UI with Deepgram design system
 *
 * Architecture:
 * - Pure vanilla JavaScript (no frameworks required)
 * - Uses native Fetch API for HTTP requests
 * - LocalStorage for history persistence
 * - Event-driven UI updates
 */

// ============================================================================
// CONFIGURATION - Customize these values for your needs
// ============================================================================

/**
 * API endpoint for transcription requests
 * Change this if your backend is hosted elsewhere
 */
const API_ENDPOINT = "/stt/transcribe";

/**
 * LocalStorage key for history persistence
 * Change this if you want to use a different storage key
 */
const HISTORY_KEY = "deepgram_transcription_history";

/**
 * Maximum number of history entries to store
 * Prevents localStorage from growing too large
 */
const MAX_HISTORY_ENTRIES = 50;

// ============================================================================
// STATE MANAGEMENT - Application state variables
// ============================================================================

/**
 * DOM Elements - Cached references to frequently used elements
 * These are initialized in the init() function
 */
let audioSourceRadios;
let audioFileInput;
let modelSelect;
let transcribeBtn;
let mainContent;
let statusContainer;
let statusMessage;
let metadataContainer;
let metadataGrid;
let historyTitle;
let historySidebarContent;

/**
 * Currently active transcription ID
 * Used to highlight the active history item
 */
let activeRequestId = null;

// ============================================================================
// LOCALSTORAGE HISTORY MANAGEMENT
// ============================================================================

/**
 * Retrieves transcription history from localStorage
 *
 * @returns {Array} Array of history entries, or empty array if none exist
 *
 * History entry structure:
 * {
 *   id: string,              // Request ID from Deepgram or local timestamp
 *   timestamp: string,       // ISO 8601 timestamp
 *   audioSource: string,     // URL or filename
 *   model: string,           // Model name used
 *   response: object         // Full transcription response
 * }
 */
function getTranscriptionHistory() {
  try {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error("Error reading transcription history:", error);
    return [];
  }
}

/**
 * Saves a transcription result to localStorage history
 *
 * @param {Object} transcriptionData - The transcription response from the API
 * @param {string} audioSource - URL or filename of the audio source
 * @param {string} model - Model name used for transcription
 * @returns {Object|null} The saved history entry, or null if save failed
 */
function saveTranscriptionToHistory(transcriptionData, audioSource, model) {
  try {
    const history = getTranscriptionHistory();

    // Get request_id from metadata or generate a fallback ID
    const requestId = transcriptionData.metadata?.request_id || `local_${Date.now()}`;

    const historyEntry = {
      id: requestId,
      timestamp: new Date().toISOString(),
      audioSource,
      model,
      response: transcriptionData,
    };

    // Add to beginning of array (newest first)
    history.unshift(historyEntry);

    // Keep only the most recent entries to prevent localStorage overflow
    const trimmedHistory = history.slice(0, MAX_HISTORY_ENTRIES);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));

    // Update history UI
    renderHistory();

    return historyEntry;
  } catch (error) {
    console.error("Error saving transcription to history:", error);
    return null;
  }
}

/**
 * Clears all transcription history from localStorage
 *
 * @returns {boolean} True if successful, false if error occurred
 */
function clearTranscriptionHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
    return true;
  } catch (error) {
    console.error("Error clearing transcription history:", error);
    return false;
  }
}

/**
 * Retrieves a specific history entry by its request ID
 *
 * @param {string} requestId - The unique ID of the history entry
 * @returns {Object|undefined} The history entry, or undefined if not found
 */
function getHistoryEntryById(requestId) {
  const history = getTranscriptionHistory();
  return history.find((entry) => entry.id === requestId);
}

// ============================================================================
// HISTORY UI RENDERING
// ============================================================================

/**
 * Renders the history sidebar with all transcription entries
 * Highlights the currently active entry if one is selected
 */
function renderHistory() {
  const history = getTranscriptionHistory();

  // Update title with count
  if (historyTitle) {
    historyTitle.textContent = `History (${history.length})`;
  }

  // Render history list
  if (historySidebarContent) {
    if (history.length === 0) {
      historySidebarContent.innerHTML = '<div class="history-empty">No transcriptions yet</div>';
    } else {
      const historyList = document.createElement("div");
      historyList.className = "history-list";

      history.forEach((entry) => {
        const item = document.createElement("a");
        const isActive = activeRequestId === entry.id;
        item.className = isActive ? "history-item history-item--active" : "history-item";
        item.href = `?request_id=${entry.id}`;
        item.onclick = (e) => {
          e.preventDefault();
          loadHistoryEntry(entry.id);
        };

        const timestamp = new Date(entry.timestamp);
        const timeStr = timestamp.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });

        item.innerHTML = `
          <div class="history-item__id" title="${entry.id}">${entry.id}</div>
          <div class="history-item__time">${timeStr}</div>
          <div class="history-item__model">${entry.model || "nova-3"}</div>
        `;

        historyList.appendChild(item);
      });

      historySidebarContent.innerHTML = "";
      historySidebarContent.appendChild(historyList);
    }
  }
}

/**
 * Loads and displays a history entry by its request ID
 *
 * @param {string} requestId - The unique ID of the history entry to load
 */
function loadHistoryEntry(requestId) {
  const entry = getHistoryEntryById(requestId);

  if (!entry) {
    showError(`History entry not found: ${requestId}`);
    return;
  }

  // Set the active request ID
  activeRequestId = entry.id;

  // Display the transcription
  displayTranscript(entry.response);
  displayMetadata(entry.response);
  hideStatus();

  // Re-render history to update highlighting
  renderHistory();
}

/**
 * Checks URL query parameters for a request_id and loads it if present
 * This enables deep linking to specific transcription results
 */
function checkUrlForRequestId() {
  const urlParams = new URLSearchParams(window.location.search);
  const requestId = urlParams.get("request_id");

  if (requestId) {
    loadHistoryEntry(requestId);
  } else {
    // No request_id means we should show the initial form state
    resetToInitialState();
  }
}

// ============================================================================
// FORM VALIDATION
// ============================================================================

/**
 * Checks if the form is valid and ready to submit
 *
 * Form is valid if either:
 * - A radio button (audio source) is selected, OR
 * - A file has been uploaded
 *
 * @returns {boolean} True if form is valid, false otherwise
 */
function isFormValid() {
  // Check if a radio button is selected
  const selectedRadio = document.querySelector('input[name="audioSource"]:checked');

  // Check if a file has been uploaded
  const hasFile = audioFileInput && audioFileInput.files && audioFileInput.files.length > 0;

  // Form is valid if either condition is true
  return !!(selectedRadio || hasFile);
}

/**
 * Updates the transcribe button's disabled state based on form validity
 * Called whenever form inputs change
 */
function updateFormValidation() {
  const isValid = isFormValid();
  transcribeBtn.disabled = !isValid;
}

// ============================================================================
// INITIALIZATION & SETUP
// ============================================================================

/**
 * Initializes the application
 * - Caches DOM element references
 * - Sets up event listeners
 * - Loads initial state from URL parameters
 * - Renders history sidebar
 *
 * Called when DOM is ready
 */
function init() {
  // Get DOM elements
  audioSourceRadios = document.querySelectorAll('input[name="audioSource"]');
  audioFileInput = document.getElementById("audioFile");
  modelSelect = document.getElementById("model");
  transcribeBtn = document.getElementById("transcribeBtn");
  mainContent = document.getElementById("mainContent");
  statusContainer = document.getElementById("statusContainer");
  statusMessage = document.getElementById("statusMessage");
  metadataContainer = document.getElementById("metadataContainer");
  metadataGrid = document.getElementById("metadataGrid");
  historyTitle = document.getElementById("historyTitle");
  historySidebarContent = document.getElementById("historySidebarContent");

  // Check if we should enable elements (no state parameter means normal operation)
  const urlParams = new URLSearchParams(window.location.search);
  const state = urlParams.get("state");

  if (!state) {
    // Enable all form elements for normal operation
    enableFormElements();
  }

  setupEventListeners();
  // Set initial state
  updateFormValidation();
  // Render history
  renderHistory();
  // Check URL for request_id
  checkUrlForRequestId();
}

/**
 * Sets up all event listeners for the application
 * - Audio source radio buttons
 * - File upload input
 * - Transcribe button
 * - Browser navigation (back/forward)
 */
function setupEventListeners() {
  // Audio source radios - listen for changes directly on radios
  audioSourceRadios.forEach((radio) => {
    radio.addEventListener("change", handleRadioChange);
  });

  // File upload
  audioFileInput.addEventListener("change", handleFileUpload);

  // Transcribe button
  transcribeBtn.addEventListener("click", handleTranscribe);

  // Handle browser back/forward navigation
  window.addEventListener("popstate", () => {
    checkUrlForRequestId();
  });
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handles radio button (audio source) selection
 * - Clears file upload when a radio is selected
 * - Resets file upload card display
 * - Updates form validation
 */
function handleRadioChange() {
  // Clear file upload when a radio is selected
  if (audioFileInput) {
    audioFileInput.value = "";
  }

  const fileCheckbox = document.getElementById("fileSelected");
  if (fileCheckbox) {
    fileCheckbox.checked = false;
  }

  // Reset file upload card text
  const fileCard = document.querySelector(".dg-card--file-upload");
  if (fileCard) {
    const descriptionEl = fileCard.querySelector("p.file-upload-description");
    if (descriptionEl) descriptionEl.textContent = "Choose from device";
  }

  // Update form validation
  updateFormValidation();
}

/**
 * Handles file upload selection
 * - Unchecks all radio buttons
 * - Checks the file upload checkbox
 * - Updates card display with filename
 * - Updates form validation
 *
 * @param {Event} e - The file input change event
 */
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (file) {
    // Uncheck all radio buttons
    audioSourceRadios.forEach((radio) => {
      radio.checked = false;
    });

    // Check the file selected checkbox
    const fileCheckbox = document.getElementById("fileSelected");
    if (fileCheckbox) {
      fileCheckbox.checked = true;
    }

    // Update card content to show file name
    const fileCard = document.querySelector(".dg-card--file-upload");
    if (fileCard) {
      const descriptionEl = fileCard.querySelector("p.file-upload-description");
      if (descriptionEl) descriptionEl.textContent = file.name;
    }
  }

  // Update form validation
  updateFormValidation();
}

/**
 * Handles transcription request
 * Main function that:
 * - Validates form input
 * - Creates FormData with file or URL
 * - Makes API request to transcription endpoint
 * - Saves result to history
 * - Displays transcription result
 * - Handles errors
 *
 * CUSTOMIZATION TIPS:
 * - Modify API_ENDPOINT constant to change backend URL
 * - Add additional form parameters before making request
 * - Customize error handling logic
 * - Add progress tracking or file size validation
 */
async function handleTranscribe() {
  const selectedRadio = document.querySelector('input[name="audioSource"]:checked');
  const file = audioFileInput.files[0];

  // Check if either a URL or file was selected
  if (!selectedRadio && !file) {
    showError("Please select an audio source or upload a file");
    return;
  }

  const model = modelSelect.value;
  let audioSource = "";

  // Disable form elements and show working status
  disableFormElements();
  showWorking();

  try {
    // Create FormData for multipart/form-data upload
    const formData = new FormData();

    if (file) {
      // File upload takes precedence
      formData.append("file", file);
      audioSource = file.name;
    } else if (selectedRadio) {
      // URL from radio button
      formData.append("url", selectedRadio.value);
      audioSource = selectedRadio.value;
    }

    // Add model parameter to form data if specified
    if (model) {
      formData.append("model", model);
    }

    // Make API request with multipart/form-data
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Validate error response matches contract
      if (errorData.error && errorData.error.message) {
        const errorCode = errorData.error.code ? ` (${errorData.error.code})` : "";
        const errorType = errorData.error.type ? `[${errorData.error.type}] ` : "";
        throw new Error(`${errorType}${errorData.error.message}${errorCode}`);
      }

      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Validate response matches contract (required: transcript field)
    if (!data.transcript && data.transcript !== "") {
      throw new Error("Invalid response: missing required 'transcript' field");
    }

    // Save to history and get the entry
    const historyEntry = saveTranscriptionToHistory(data, audioSource, model);

    // Set the active request ID and display
    if (historyEntry) {
      activeRequestId = historyEntry.id;
      enableFormElements();
      displayTranscript(data);
      displayMetadata(data);
      hideStatus();
      renderHistory(); // Re-render to highlight the active item
    } else {
      // Fallback: display directly if save failed
      enableFormElements();
      displayTranscript(data);
      displayMetadata(data);
      hideStatus();
    }
  } catch (error) {
    console.error("Transcription error:", error);
    // Re-enable form elements on error
    enableFormElements();
    showError(error.message);
  }
}

// ============================================================================
// UI STATE MANAGEMENT
// ============================================================================

/**
 * Shows "processing" status indicator
 * Displays spinner and hides metadata
 */
function showWorking() {
  statusContainer.style.display = "block";
  statusMessage.className = "dg-status dg-status--with-icon dg-status--primary";
  statusMessage.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin dg-status__icon"></i> Processing transcription...';
  metadataContainer.style.display = "none";
}

/**
 * Shows error status indicator
 * Displays error icon and message, hides metadata
 *
 * @param {string} message - The error message to display
 */
function showError(message) {
  statusContainer.style.display = "block";
  statusMessage.className = "dg-status dg-status--with-icon dg-status--error";
  statusMessage.innerHTML = `<i class="fa-solid fa-circle-exclamation dg-status__icon"></i> ${message}`;
  metadataContainer.style.display = "none";
}

/**
 * Hides the status indicator
 */
function hideStatus() {
  statusContainer.style.display = "none";
}

// ============================================================================
// RESULTS DISPLAY
// ============================================================================

/**
 * Displays the transcription result in the main content area
 *
 * @param {Object} data - The transcription response data
 * @param {string} data.transcript - The transcribed text
 *
 * CUSTOMIZATION TIP:
 * - Modify this function to display additional fields like paragraphs, words, etc.
 * - Add word-level highlighting or timestamps
 * - Format output differently (e.g., show speakers for diarization)
 */
function displayTranscript(data) {
  const transcript = data.transcript || "No transcript available";

  mainContent.innerHTML = `
    <div style="max-width: 800px;">
      <h2 class="dg-section-heading">Transcript</h2>
      <div class="transcript-text">
        ${escapeHtml(transcript)}
      </div>
    </div>
  `;
}

/**
 * Resets the application to its initial state
 * - Clears active request ID
 * - Shows form sections
 * - Hides metadata and status
 * - Resets main content to empty state
 * - Re-enables form elements
 */
function resetToInitialState() {
  // Clear active request ID
  activeRequestId = null;

  // Show form sections
  const controlsSections = document.querySelectorAll(".controls-section");
  controlsSections.forEach((section) => {
    section.style.display = "block";
  });

  // Hide metadata
  if (metadataContainer) {
    metadataContainer.style.display = "none";
  }

  // Hide status
  hideStatus();

  // Reset main content to empty state
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon dg-text-primary"><i class="fa-solid fa-microphone"></i></div>
        <h2 class="dg-section-heading">Select your audio and options to try out transcription</h2>
        <p class="dg-prose">
          Choose an audio source from the sidebar, configure your options, and click transcribe to get started.
        </p>
        <button id="transcribeBtn" class="dg-btn dg-btn--primary" style="margin-top: 1.5rem;" disabled>
          Transcribe Audio
        </button>
      </div>
    `;

    // Re-attach event listener to the new transcribe button
    transcribeBtn = document.getElementById("transcribeBtn");
    if (transcribeBtn) {
      transcribeBtn.addEventListener("click", handleTranscribe);
    }
  }

  // Enable form elements
  enableFormElements();

  // Update form validation
  updateFormValidation();

  // Re-render history to clear highlighting
  renderHistory();
}

/**
 * Displays transcription metadata in the sidebar
 * Shows duration, word count, and any metadata from the response
 *
 * @param {Object} data - The transcription response data
 * @param {number} [data.duration] - Audio duration in seconds
 * @param {Array} [data.words] - Array of words with timestamps
 * @param {Object} [data.metadata] - Additional metadata from Deepgram
 *
 * CUSTOMIZATION TIP:
 * - Add or remove metadata fields
 * - Format values differently (e.g., duration as MM:SS)
 * - Add custom calculated metrics
 */
function displayMetadata(data) {
  // Hide form sections
  const controlsSections = document.querySelectorAll(".controls-section");
  controlsSections.forEach((section) => {
    section.style.display = "none";
  });

  metadataContainer.style.display = "block";

  const metadata = [];

  if (data.duration !== undefined) {
    metadata.push({
      label: "Duration",
      value: `${data.duration.toFixed(2)}s`,
    });
  }

  if (data.words && data.words.length > 0) {
    metadata.push({
      label: "Word Count",
      value: data.words.length,
    });
  }

  if (data.metadata) {
    Object.entries(data.metadata).forEach(([key, value]) => {
      metadata.push({
        label: key,
        value: typeof value === "object" ? JSON.stringify(value) : String(value),
      });
    });
  }

  const metadataHTML = metadata
    .map(
      (item) => `
    <div class="metadata-item">
      <div class="metadata-label">${escapeHtml(item.label)}</div>
      <div class="metadata-value">${escapeHtml(item.value)}</div>
    </div>
  `
    )
    .join("");

  // Get base path without query parameters
  const basePath = window.location.pathname;

  metadataGrid.innerHTML = `
    ${metadataHTML}
    <a href="${basePath}" class="dg-btn dg-btn--ghost" style="margin-top: 1rem; display: inline-flex; align-items: center;">
      <i class="fa-solid fa-arrow-left" style="margin-right: 0.5rem;"></i>
      Transcribe Another
    </a>
  `;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Escapes HTML special characters to prevent XSS attacks
 * Uses browser's native text rendering to safely escape content
 *
 * @param {string} text - The text to escape
 * @returns {string} HTML-safe escaped text
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Disables all form elements during transcription processing
 * Prevents user from making changes while request is in flight
 * Adds visual feedback with disabled styling
 */
function disableFormElements() {
  // Query DOM directly to ensure we get the latest elements
  const radios = document.querySelectorAll('input[name="audioSource"]');
  const fileInput = document.getElementById("audioFile");
  const select = document.getElementById("model");
  const btn = document.getElementById("transcribeBtn");

  // Disable audio source radios
  radios.forEach((radio) => {
    radio.disabled = true;
  });

  // Disable file upload
  if (fileInput) {
    fileInput.disabled = true;
  }

  // Disable model select
  if (select) {
    select.disabled = true;
  }

  // Disable transcribe button
  if (btn) {
    btn.disabled = true;
  }

  // Add visual feedback to cards by adding disabled class
  const cards = document.querySelectorAll(".dg-card--selectable, .dg-card--file-upload");
  cards.forEach((card) => {
    card.classList.add("dg-card--disabled");
  });
}

/**
 * Re-enables all form elements after transcription completes
 * Removes disabled styling and re-validates form
 */
function enableFormElements() {
  // Query DOM directly to ensure we get the latest elements
  const radios = document.querySelectorAll('input[name="audioSource"]');
  const fileInput = document.getElementById("audioFile");
  const select = document.getElementById("model");

  // Enable audio source radios
  radios.forEach((radio) => {
    radio.disabled = false;
  });

  // Enable file upload
  if (fileInput) {
    fileInput.disabled = false;
  }

  // Enable model select
  if (select) {
    select.disabled = false;
  }

  // Re-enable transcribe button (but respect form validation)
  updateFormValidation();

  // Remove visual feedback from cards by removing disabled class
  const cards = document.querySelectorAll(".dg-card--selectable, .dg-card--file-upload");
  cards.forEach((card) => {
    card.classList.remove("dg-card--disabled");
  });
}

// ============================================================================
// STATE PREVIEW MODE - For development and testing
// ============================================================================

/**
 * Checks URL parameters for state preview mode
 * Used for testing different UI states during development
 *
 * Available states:
 * - ?state=waiting  - Shows processing/loading state
 * - ?state=results  - Shows results with mock data
 * - ?state=error    - Shows error state
 * - (no parameter)  - Shows normal initial state
 */
function checkUrlStateParameter() {
  const urlParams = new URLSearchParams(window.location.search);
  const state = urlParams.get("state");

  if (state === "waiting") {
    setWaitingState();
  } else if (state === "results") {
    setResultsState();
  } else if (state === "error") {
    setErrorState();
  }
  // Default state (initial) is already set by HTML
}

/**
 * Sets the UI to "waiting" state with mock data
 * Used for development and testing
 */
function setWaitingState() {
  // Select first radio button
  const firstRadio = document.querySelector('input[name="audioSource"]');
  if (firstRadio) {
    firstRadio.checked = true;
  }

  // Update main content to show processing state
  const content = document.getElementById("mainContent");
  if (content) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon dg-text-primary">
          <i class="fa-solid fa-spinner fa-spin"></i>
        </div>
        <h2 class="dg-section-heading">Processing your audio...</h2>
        <p class="dg-prose">
          Your transcription request is being processed. This may take a few moments depending on the audio length.
        </p>
      </div>
    `;
  }

  // Show working status
  showWorking();

  // Elements stay disabled (they're disabled by default in HTML)
}

/**
 * Sets the UI to "results" state with mock transcription data
 * Used for development and testing
 */
function setResultsState() {
  // Select first radio button
  const firstRadio = document.querySelector('input[name="audioSource"]');
  if (firstRadio) {
    firstRadio.checked = true;
    updateFormValidation();
  }

  // Re-enable form elements
  enableFormElements();

  // Mock response data
  const mockData = {
    transcript:
      "Yeah, as as much as it's worth celebrating, the first spacewalk, with an all female team, I think many of us are looking forward to it just being normal. And I think if it signifies anything, it is to honor the the women who came before us who, um, were skilled and qualified, and didn't get the same opportunities that we have today.",
    duration: 17.64,
    words: [
      { word: "yeah", start: 0.08, end: 0.32 },
      { word: "as", start: 0.32, end: 0.48 },
      { word: "as", start: 0.64, end: 0.8 },
      { word: "much", start: 0.8, end: 1.04 },
      { word: "as", start: 1.04, end: 1.12 },
    ],
    metadata: {
      model_uuid: "6103c447-e5a9-45b9-8d1f-f168eae8b5f4",
      request_id: "99f23e1a-7e98-4e50-a33c-2c7e2b6f0a4a",
      model_name: "nova-3",
    },
  };

  displayTranscript(mockData);
  displayMetadata(mockData);
  hideStatus();
}

/**
 * Sets the UI to "error" state with mock error message
 * Used for development and testing
 */
function setErrorState() {
  // Select first radio button
  const firstRadio = document.querySelector('input[name="audioSource"]');
  if (firstRadio) {
    firstRadio.checked = true;
    updateFormValidation();
  }

  // Re-enable form elements
  enableFormElements();

  // Update main content to show error state
  const basePath = window.location.pathname;
  mainContent.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon" style="color: var(--dg-danger, #f04438);">
        <i class="fa-solid fa-circle-exclamation"></i>
      </div>
      <h2 class="dg-section-heading">Transcription Failed</h2>
      <p class="dg-prose">
        We encountered an error while processing your audio. Please check your connection and try again.
      </p>
      <a href="${basePath}" class="dg-btn dg-btn--ghost" style="margin-top: 1.5rem; display: inline-flex; align-items: center;">
        <i class="fa-solid fa-arrow-left" style="margin-right: 0.5rem;"></i>
        Transcribe Another
      </a>
    </div>
  `;

  // Show error status
  showError("Unable to connect to transcription service. Please try again later.");
}

// ============================================================================
// APPLICATION BOOTSTRAP
// ============================================================================

/**
 * Initialize the application when DOM is ready
 * Handles both loading and already-loaded states
 */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    init();
    checkUrlStateParameter();
  });
} else {
  init();
  checkUrlStateParameter();
}
