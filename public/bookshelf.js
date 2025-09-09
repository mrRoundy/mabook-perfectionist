// public/bookshelf.js

/**
 * Initializes a bookshelf component, fetches its books, and sets up scroll controls.
 * @param {string} sectionId - The ID of the main <section> element for this bookshelf.
 * @param {string} genre - The book genre to fetch from Supabase.
 * @param {object} supabase - The initialized Supabase client.
 */
export function initializeBookshelf(sectionId, genre, supabase) {
    (async () => {
        // This function fetches books from your database
        async function fetchBooksByGenre(genreToFetch) {
            const { data, error } = await supabase
                .from('filtered_books')
                .select('id, title, author, image')
                .ilike('sub-genre', `%${genreToFetch}%`)
                .limit(10);

            if (error) {
                console.error(`Error fetching books for genre "${genreToFetch}":`, error);
                return [];
            }
            return data;
        }

        // Find the specific section for this bookshelf
        const sectionElement = document.getElementById(sectionId);
        if (!sectionElement) {
            console.error(`Bookshelf section with ID "${sectionId}" not found.`);
            return;
        }

        // --- THE FIX IS HERE ---
        // We find the buttons and shelf *inside* the specific sectionElement.
        const bookshelf = sectionElement.querySelector('.bookshelf');
        const scrollLeftBtn = sectionElement.querySelector('[aria-label="Scroll left"]');
        const scrollRightBtn = sectionElement.querySelector('[aria-label="Scroll right"]');

        // Check if we found all the parts we need
        if (!bookshelf || !scrollLeftBtn || !scrollRightBtn) {
            console.error(`Could not find all required elements inside section "${sectionId}".`);
            return;
        }

        const booksData = await fetchBooksByGenre(genre);

        // If no books are found, hide the buttons and show a message
        if (!booksData || booksData.length === 0) {
            bookshelf.innerHTML = `<p style="color: #a0a0a0; text-align: center; width: 100%;">No books found for ${genre}.</p>`;
            scrollLeftBtn.style.display = 'none';
            scrollRightBtn.style.display = 'none';
            return;
        }

        // This function creates the HTML for a single book
        function createBookElement(book) {
            const link = document.createElement('a');
            link.href = `book-details.html?id=${book.id}`;
            link.className = "book-item-link";

            const bookItem = document.createElement('div');
            bookItem.className = "book-item";
            bookItem.innerHTML = `
                <div class="book-wrapper-3d">
                    <div class="book-cover-3d">
                        <img src="${book.image}" alt="Cover of ${book.title}">
                    </div>
                    <div class="book-spine-3d">
                        <h4>${book.title}</h4>
                    </div>
                </div>
                <div class="book-info">
                    <h3>${book.title}</h3>
                    <p>by ${book.author || 'Unknown'}</p>
                </div>`;
            
            link.appendChild(bookItem);
            return link;
        }

        // --- Scrolling Logic ---
        
        // We duplicate the books to create a seamless "infinite" loop effect
        const originalBookCount = booksData.length;
        const allBooksData = [...booksData, ...booksData];
        allBooksData.forEach(book => bookshelf.appendChild(createBookElement(book)));

        let currentIndex = 0;
        const transitionDuration = 800;

        function updateScrollPosition(transition = true) {
            if (bookshelf.children.length === 0) return;
            const bookWidth = bookshelf.children[0].offsetWidth;
            const gap = parseFloat(window.getComputedStyle(bookshelf).gap);
            const scrollAmount = (bookWidth + gap) * currentIndex;
            bookshelf.style.transition = transition ? `transform ${transitionDuration}ms ease-in-out` : 'none';
            bookshelf.style.transform = `translateX(-${scrollAmount}px)`;
        }

        function scrollNext() {
            currentIndex++;
            updateScrollPosition();
            // If we scroll past the original books, jump back to the start without animation
            if (currentIndex >= originalBookCount) {
                setTimeout(() => {
                    currentIndex = 0;
                    updateScrollPosition(false);
                }, transitionDuration);
            }
        }

        function scrollPrev() {
            // If we are at the beginning, jump to the end of the cloned list
            if (currentIndex <= 0) {
                currentIndex = originalBookCount;
                updateScrollPosition(false);
                setTimeout(() => {
                    currentIndex--;
                    updateScrollPosition();
                }, 20);
            } else {
                currentIndex--;
                updateScrollPosition();
            }
        }

        // Attach the click events to this shelf's specific buttons
        scrollRightBtn.addEventListener('click', scrollNext);
        scrollLeftBtn.addEventListener('click', scrollPrev);

    })();
}