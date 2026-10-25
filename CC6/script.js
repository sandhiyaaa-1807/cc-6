let db;

// Open IndexedDB database
const request = indexedDB.open("CloudFileStorage", 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;

    if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files", {
            keyPath: "id",
            autoIncrement: true
        });
    }
};

request.onsuccess = function(event) {
    db = event.target.result;
    displayFiles();
};

request.onerror = function() {
    alert("Unable to open file storage.");
};

// Upload file
function uploadFile() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a file!");
        return;
    }

    if (!db) {
        alert("Storage is not ready. Try again.");
        return;
    }

    const transaction = db.transaction("files", "readwrite");
    const store = transaction.objectStore("files");

    store.add({
        name: file.name,
        size: file.size,
        type: file.type,
        data: file,
        date: new Date().toLocaleString()
    });

    transaction.oncomplete = function() {
        alert("File uploaded successfully!");
        fileInput.value = "";
        displayFiles();
    };

    transaction.onerror = function() {
        alert("File upload failed!");
    };
}

// Display uploaded files
function displayFiles() {
    const fileList = document.getElementById("fileList");

    fileList.innerHTML = "";

    const transaction = db.transaction("files", "readonly");
    const store = transaction.objectStore("files");

    const request = store.getAll();

    request.onsuccess = function() {
        const files = request.result;

        if (files.length === 0) {
            fileList.textContent = "No files uploaded yet.";
            return;
        }

        files.forEach(function(file) {
            const fileItem = document.createElement("div");
            fileItem.className = "file-item";

            const fileInfo = document.createElement("div");
            fileInfo.className = "file-info";

            const fileName = document.createElement("strong");
            fileName.textContent = "📄 " + file.name;

            const fileSize = document.createElement("p");
            fileSize.textContent =
                "Size: " + (file.size / 1024).toFixed(2) + " KB";

            fileInfo.appendChild(fileName);
            fileInfo.appendChild(fileSize);

            const buttons = document.createElement("div");

            const downloadButton = document.createElement("button");
            downloadButton.textContent = "Download";
            downloadButton.className = "download-btn";
            downloadButton.onclick = function() {
                downloadFile(file.id);
            };

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-btn";
            deleteButton.onclick = function() {
                deleteFile(file.id);
            };

            buttons.appendChild(downloadButton);
            buttons.appendChild(deleteButton);

            fileItem.appendChild(fileInfo);
            fileItem.appendChild(buttons);

            fileList.appendChild(fileItem);
        });
    };
}

// Download file
function downloadFile(id) {
    const transaction = db.transaction("files", "readonly");
    const store = transaction.objectStore("files");

    const request = store.get(id);

    request.onsuccess = function() {
        const file = request.result;

        if (!file) {
            alert("File not found!");
            return;
        }

        const url = URL.createObjectURL(file.data);

        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(function() {
            URL.revokeObjectURL(url);
        }, 1000);
    };
}

// Delete file
function deleteFile(id) {
    if (!confirm("Are you sure you want to delete this file?")) {
        return;
    }

    const transaction = db.transaction("files", "readwrite");
    const store = transaction.objectStore("files");

    store.delete(id);

    transaction.oncomplete = function() {
        alert("File deleted successfully!");
        displayFiles();
    };
}