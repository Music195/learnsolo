document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search");
    const resultsBox = document.getElementById("search-results");
    const noteSelect = document.getElementById("noteSelect");

    function updateSubfolderOptions() {
        const folder = document.getElementById('folderFilter').value;
        const subfolderFilter = document.getElementById('subfolderFilter');

        // Find subfolders for the selected folder
        let subfolders = new Set();
        NOTES_LIST.forEach(note => {
            const parts = note.split('/');
            if (parts.length > 1 && parts[0] === folder) {
                subfolders.add(parts[1]);
            }
        });

        // Clear and repopulate options
        subfolderFilter.innerHTML = `<option value="">Title</option>`;
        Array.from(subfolders).sort().forEach(sub => {
            const opt = document.createElement("option");
            opt.value = sub;
            opt.textContent = sub;
            subfolderFilter.appendChild(opt);
        });
    }

    function filterNotes() {
        const folder = document.getElementById('folderFilter').value;
        const subfolder = document.getElementById('subfolderFilter').value;
        noteSelect.innerHTML = "";

        let filtered = NOTES_LIST;
        if (folder) {
            filtered = filtered.filter(n => n.startsWith(folder + '/'));
        }
        if (subfolder) {
            filtered = filtered.filter(n => n.split('/')[1] === subfolder);
        }

        filtered.forEach(n => {
            const opt = document.createElement("option");
            opt.value = "/note/" + n;
            opt.textContent = n.split('/').pop(); // Show only filename
            noteSelect.appendChild(opt);
        });
    }

    // Initialize dropdowns on page load
    updateSubfolderOptions();
    filterNotes();

    // Link dropdowns
    document.getElementById('folderFilter').addEventListener('change', () => {
        updateSubfolderOptions();
        filterNotes();
    });
    document.getElementById('subfolderFilter').addEventListener('change', filterNotes);

    // Fuzzy search with Fuse.js
    const fuse = new Fuse(NOTES_LIST, { includeScore: true, threshold: 0.4 });

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim();
        resultsBox.innerHTML = "";
        if (!query) return;
        const results = fuse.search(query).slice(0, 10);
        results.forEach(result => {
            const a = document.createElement("a");
            a.href = "/note/" + result.item;
            let filename = result.item.split('/').pop();
            if (filename.endsWith('.html')) {
                filename = filename.slice(0, -5);
            }
            a.textContent = filename;
            resultsBox.appendChild(a);
        });

        searchInput.addEventListener("blur", () => {
            setTimeout(() => { resultsBox.style.display = "none"; }, 200);
        });
        // Show or hide the box based on results
        if (results.length > 0) {
            resultsBox.style.display = "block";
        } else {
            resultsBox.style.display = "none";
        }
    });

    // Arrow key navigation
    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
            const back = document.querySelector(".nav-buttons a:first-child");
            if (back) window.location.href = back.href;
        }
        if (e.key === "ArrowRight") {
            const next = document.querySelector(".nav-buttons a:last-child");
            if (next) window.location.href = next.href;
        }
    });
});