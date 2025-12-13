document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search");
    const resultsBox = document.getElementById("search-results");
    const noteSelect = document.getElementById("noteSelect");
    const notesMeta = (typeof NOTES_META !== "undefined" && Array.isArray(NOTES_META))
        ? NOTES_META
        : (Array.isArray(NOTES_LIST) ? NOTES_LIST.map(path => ({ path, title: path.split('/').pop() })) : []);

    // Build subfolder dropdown based on the currently selected folder
    function updateSubfolderOptions() {
        const folder = document.getElementById('folderFilter').value;
        const subfolderFilter = document.getElementById('subfolderFilter');

        // Discover unique subfolders for the chosen folder to keep the list scoped
        let subfolders = new Set();
        notesMeta.forEach(note => {
            const parts = note.path.split('/');
            if (parts.length > 1 && parts[0] === folder) {
                subfolders.add(parts[1]);
            }
        });

        // Refresh the options to reflect the latest subfolder set
        subfolderFilter.innerHTML = `<option value="">Title</option>`;
        Array.from(subfolders).sort().forEach(sub => {
            const opt = document.createElement("option");
            opt.value = sub;
            opt.textContent = sub;
            subfolderFilter.appendChild(opt);
        });

        // Restore saved subfolder when the parent folder matches
        const savedSubfolder = localStorage.getItem('selectedSubfolder');
        if (savedSubfolder && folder === localStorage.getItem('selectedFolder')) {
            subfolderFilter.value = savedSubfolder;
        }
    }

    // Filter note list by folder/subfolder and repopulate the main select
    function filterNotes() {
        const folder = document.getElementById('folderFilter').value;
        const subfolder = document.getElementById('subfolderFilter').value;
        noteSelect.innerHTML = "";

        let filtered = notesMeta;
        if (folder) {
            filtered = filtered.filter(n => n.path.startsWith(folder + '/'));
        }
        if (subfolder) {
            filtered = filtered.filter(n => {
                const parts = n.path.split('/');
                return parts.length > 1 && parts[1] === subfolder;
            });
        }
         
        noteSelect.innerHTML = "<option value=''>-- Select a topic --</option>";

        filtered.forEach(n => {
            const opt = document.createElement("option");
            opt.value = "/note/" + n.path;
            opt.textContent = n.title || n.path.split('/').pop();
            noteSelect.appendChild(opt);
        });
    }

    // Restore saved selections on page load so returning users keep their last folder choice
    const savedFolder = localStorage.getItem('selectedFolder');
    const folderFilter = document.getElementById('folderFilter');
    if (savedFolder) {
        folderFilter.value = savedFolder;
    }

    // Initialize dropdowns on page load to sync UI with current filters
    updateSubfolderOptions();
    filterNotes();

    // Persist folder choice and reset dependent subfolder when folder changes
    folderFilter.addEventListener('change', () => {
        const selectedFolder = folderFilter.value;
        localStorage.setItem('selectedFolder', selectedFolder);
        localStorage.removeItem('selectedSubfolder'); // Clear subfolder when folder changes
        updateSubfolderOptions();
        filterNotes();
    });
    
    // Persist subfolder choice and refresh the note list
    document.getElementById('subfolderFilter').addEventListener('change', () => {
        const selectedSubfolder = document.getElementById('subfolderFilter').value;
        localStorage.setItem('selectedSubfolder', selectedSubfolder);
        filterNotes();
    });

    // Client-side fuzzy search over all notes (favor human titles, fall back to path)
    const fuse = new Fuse(notesMeta, {
        includeScore: true,
        threshold: 0.4,
        keys: [
            { name: "title", weight: 0.9 },
            { name: "path", weight: 0.1 }
        ]
    });

    // Live search results with minimal debounce via DOM event only
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim();
        resultsBox.innerHTML = "";
        if (!query) return;
        const results = fuse.search(query).slice(0, 10);
        results.forEach(result => {
            const a = document.createElement("a");
            const note = result.item;
            a.href = "/note/" + note.path;
            a.textContent = note.title || note.path.split('/').pop();
            resultsBox.appendChild(a);
        });

        searchInput.addEventListener("blur", () => {
            setTimeout(() => { resultsBox.style.display = "none"; }, 200);
        });
        // Show or hide the box based on results to avoid empty dropdown
        if (results.length > 0) {
            resultsBox.style.display = "block";
        } else {
            resultsBox.style.display = "none";
        }
    });

    // Arrow key navigation to move between previous/next pages quickly
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
