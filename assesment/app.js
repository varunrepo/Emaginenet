let tableData = [];
let editingRowId = null;

const tableBody = document.getElementById("tableBody");
const modal = document.getElementById("modal");
const openModalButton = document.getElementById("openModal");
const closeModalButton = document.getElementById("closeModal");
const modalForm = document.getElementById("modalForm");
const phoneNumberInput = document.getElementById("phoneNumber");
const statusInput = document.getElementById("status");
const notesInput = document.getElementById("notes");
const filterBlocked = document.getElementById("filterBlocked");
const searchInput = document.getElementById("searchInput");
const clearButton = document.getElementById("clearButton");
// Render the table
async function renderTable() {
  // Fetch data from the API
  const response = await fetch("http://localhost:8080/phones"); 
  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }

  // Parse the JSON response
  tableData = await response.json();
  tableBody.innerHTML = "";  
  tableData = tableData.filter((row) => !filterBlocked.checked || row.status === "blocked");
  if (tableData.length === 0) {
    // If no data, show "No records found"
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td colspan="5" style="text-align: center;">No records found</td>
    `;
    tableBody.appendChild(tr);
    return;
  }
  tableData.forEach((row, index) => {
      const tr = document.createElement("tr");
       // Determine the status color
  let statusClass = "";
  switch (row.status.toLowerCase()) {
    case "active":
      statusClass = "status-active"; // Green
      break;
    case "blocked":
      statusClass = "status-blocked"; // Red
      break;
    default:
      statusClass = "status-unknown"; // Default style
  }
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${row.phone_number}</td>
        <td class="${statusClass}">${row.status.toUpperCase()}</td>
        <td>${row.notes}</td>
        <td class="actions">
          <button class="edit" onclick="editRow(${index})" title="Edit">
            <i class="fa fa-pencil-alt"></i>
          </button>
          <button class="delete" onclick="deleteRow(${index})" title="Delete">
            <i class="fa fa-trash"></i>
          </button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
    
}

// Filter table rows based on search input
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();
  let tableDataValues = [...tableData];
  const filteredData = tableDataValues.filter((row) =>
    row.phone_number.toLowerCase().includes(query)
  );
  renderFilteredTable(filteredData);
});

// Render table with filtered data
function renderFilteredTable(data) {
  tableBody.innerHTML = "";
  if (data.length === 0) {
    // If no data, show "No records found"
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td colspan="5" style="text-align: center;">No records found</td>
    `;
    tableBody.appendChild(tr);
    return;
  }
  data.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${row.phone_number}</td>
      <td>${row.status.toUpperCase()}</td>
      <td>${row.notes}</td>
      <td class="actions">
        <button class="edit" onclick="editRow(${index})">Edit</button>
        <button class="delete" onclick="deleteRow(${index})">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// Open the modal
function openModal(isEdit = false, index = null) {
  if (isEdit) {
    const row = tableData[index];
    editingRowId = row.id;
    phoneNumberInput.value = row.phone_number;
    statusInput.value = row.status.toLowerCase();
    notesInput.value = row.notes;
  } else {
    phoneNumberInput.value = "";
    statusInput.value = "active";
    notesInput.value = "";
    editingRowId = null;
  }
  modal.style.display = "block";
}

// Close the modal
function closeModal() {
  modal.style.display = "none";
}

// Add or update a row
modalForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  
  const phoneNumber = phoneNumberInput.value.trim();
  const status = statusInput.value.trim();
  const notes = notesInput.value.trim();
  const phoneError = document.getElementById("phoneError");

 
  if (phoneNumber.length !== 10) {
    phoneError.textContent = "Please enter a valid 10-digit phone number.";
    phoneError.style.color = "red";
    return;
  }

  phoneError.textContent = "";

  const payload = {
    id : editingRowId,
    phone_number: phoneNumber,
    status: status,
    notes: notes,
  };

  try {
    if (editingRowId !== null) {
      // Update existing row (PUT request)
      const response = await fetch(`http://localhost:8080/phones`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      alert("Row updated successfully!");
      editingRowId = null;
      await renderTable();
      closeModal();  
    } else {
      // Add new row (POST request)
      const response = await fetch("http://localhost:8080/phones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Handle specific status codes
        if (response.status === 409) {
          alert("Phone number already exists!");  
          await renderTable();
          closeModal();    
        } else {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
      } else {
        alert("Row added successfully!");
         // Reload table data from the backend after a successful save
        await renderTable();
        closeModal();    
      }
    }

   
  } catch (error) {
    console.error("Error saving data:", error);
    alert("Failed to save data. Please try again.");
  }
});

// Edit a row
function editRow(rowIndex) {
  openConfirmationModal("edit", rowIndex, (index) => {
    // Make the phone number readonly
    phoneNumberInput.setAttribute("readonly", true);
    console.log(`Editing row with index: ${index}`);
    openModal(true, index);
  });
  
}
// Clear the search input and re-render the table
clearButton.addEventListener("click", () => {
  searchInput.value = ""; // Clear the input field
  searchInput.dispatchEvent(new Event("input"));
});

// Delete a row
async function deleteRow(index) {
  const row = tableData[index];
  editingRowId = row.id; 

  // Open confirmation modal
  openConfirmationModal("delete", index, async () => {
    try {
      // Make the DELETE API call
      const response = await fetch(`http://localhost:8080/phones/${editingRowId}`, {
        method: "PUT", // Use DELETE method for clarity
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
    //  alert("Row deleted successfully!");
      editingRowId = null;    
      // Re-render the table
      renderTable();
    } catch (error) {
      console.error("Error deleting row:", error);
      alert("Failed to delete the row. Please try again.");
    }
  });
}

// Filter blocked numbers
filterBlocked.addEventListener("change", renderTable);

// Event listeners
openModalButton.addEventListener("click", () => {
  // Remove readonly attribute for add mode
  phoneNumberInput.removeAttribute("readonly");
  openModal();
});
closeModalButton.addEventListener("click", closeModal);
window.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

function openConfirmationModal(action, rowIndex, callback) {
  // Set modal content dynamically
  if (action === "delete") {
    deleteModalTitle.textContent = "Delete Confirmation";
    deleteModalMessage.textContent = "Are you sure you want to delete this item?";
    confirmButton.textContent = "Delete";
  } else if (action === "edit") {
    deleteModalTitle.textContent = "Edit Confirmation";
    deleteModalMessage.textContent = "Are you sure you want to edit this item?";
    confirmButton.textContent = "Edit";
  }

  // Show modal
  confirmationModal.style.display = "flex";

  // Add event listener for confirmation
  confirmButton.onclick = () => {
    callback(rowIndex); // Perform the callback (delete or edit logic)
    closeDeleteModal();
  };

  // Add event listener for cancel
  cancelButton.onclick = closeDeleteModal;
}

// Close the modal
function closeDeleteModal() {
  confirmationModal.style.display = "none";
}
// Initial render
renderTable();



