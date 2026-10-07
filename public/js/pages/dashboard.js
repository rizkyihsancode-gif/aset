document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================
       ELEMENT
    ========================================================= */

    const deck =
        document.getElementById('dashboardDeck');

    if (!deck) {
        return;
    }

    const slides =
        Array.from(
            deck.querySelectorAll('.dashboard-slide')
        );

    const thumbnails =
        Array.from(
            deck.querySelectorAll('.dashboard-thumbnail')
        );

    const dotsContainer =
        document.getElementById('dashboardDots');

    const prevButton =
        document.getElementById('dashboardPrev');

    const nextButton =
        document.getElementById('dashboardNext');

    const pauseButton =
        document.getElementById('dashboardPauseButton');

    const presentationButton =
        document.getElementById(
            'dashboardPresentationButton'
        );

    const fullscreenInside =
        document.getElementById(
            'dashboardFullscreenInside'
        );


    /* =========================================================
       CONFIG
    ========================================================= */

    const AUTOPLAY_DELAY =
        8000;

    const RESUME_DELAY =
        15000;

    const SWIPE_MIN_DISTANCE =
        52;


    /* =========================================================
       STATE
    ========================================================= */

    let currentSlide =
        0;

    let autoplayEnabled =
        true;

    let autoplayTimer =
        null;

    let resumeTimer =
        null;

    let pointerStartX =
        null;

    let pointerStartY =
        null;


    /* =========================================================
       LUCIDE ICON
    ========================================================= */

    function refreshIcons()
    {
        if (
            window.lucide
            &&
            typeof window.lucide.createIcons
            ===
            'function'
        ) {
            window.lucide.createIcons();
        }
    }


    /* =========================================================
       DOT NAVIGATION
    ========================================================= */

    if (dotsContainer) {

        dotsContainer.innerHTML =
            '';

        slides.forEach(
            (
                _,
                index
            ) => {

                const dot =
                    document.createElement(
                        'button'
                    );

                dot.type =
                    'button';

                dot.className =
                    'dashboard-dot';

                dot.setAttribute(
                    'aria-label',
                    `Buka slide ${index + 1}`
                );

                dot.addEventListener(
                    'click',
                    () => {

                        userNavigate(
                            index
                        );
                    }
                );

                dotsContainer
                    .appendChild(
                        dot
                    );
            }
        );
    }


    const dots =
        Array.from(
            dotsContainer?.children
            ??
            []
        );


    /* =========================================================
       NORMALIZE INDEX
    ========================================================= */

    function normalizeSlideIndex(
        index
    )
    {
        if (!slides.length) {
            return 0;
        }

        if (index < 0) {
            return slides.length - 1;
        }

        if (
            index >= slides.length
        ) {
            return 0;
        }

        return index;
    }


    /* =========================================================
       SHOW SLIDE
       Animasi tetap berasal dari class CSS .is-active
       dan data-direction.
    ========================================================= */

    function showSlide(
        index,
        userInteraction = false
    )
    {
        if (!slides.length) {
            return;
        }

        const previousSlide =
            currentSlide;

        currentSlide =
            normalizeSlideIndex(
                index
            );


        /*
         * Memberitahu CSS arah animasi.
         */
        deck.dataset.direction =
            currentSlide < previousSlide
                ?
                'prev'
                :
                'next';


        /*
         * Slide.
         */
        slides.forEach(
            (
                slide,
                slideIndex
            ) => {

                const active =
                    slideIndex === currentSlide;

                slide.classList.toggle(
                    'is-active',
                    active
                );

                slide.setAttribute(
                    'aria-hidden',
                    active
                        ?
                        'false'
                        :
                        'true'
                );
            }
        );


        /*
         * Thumbnail.
         */
        thumbnails.forEach(
            (
                thumbnail,
                thumbnailIndex
            ) => {

                const active =
                    thumbnailIndex === currentSlide;

                thumbnail.classList.toggle(
                    'is-active',
                    active
                );

                thumbnail.setAttribute(
                    'aria-current',
                    active
                        ?
                        'true'
                        :
                        'false'
                );
            }
        );


        /*
         * Dots.
         */
        dots.forEach(
            (
                dot,
                dotIndex
            ) => {

                dot.classList.toggle(
                    'is-active',
                    dotIndex === currentSlide
                );
            }
        );


        /*
         * Jika user melakukan navigasi manual,
         * autoplay berhenti sementara 15 detik.
         */
        if (
            userInteraction
        ) {
            pauseTemporarily();
        }


        /*
         * Slide 3.
         */
        if (
            currentSlide === 2
        ) {

            window.requestAnimationFrame(
                () => {

                    renderGrowthChart();
                }
            );
        }


        /*
         * Slide 5.
         */
        if (
            currentSlide === 4
        ) {

            window.requestAnimationFrame(
                () => {

                    renderLocationMap();
                }
            );
        }


        refreshIcons();
    }


    function userNavigate(
        index
    )
    {
        showSlide(
            index,
            true
        );
    }


    /* =========================================================
       AUTOPLAY
    ========================================================= */

    function stopAutoplayTimer()
    {
        if (
            autoplayTimer
        ) {

            window.clearInterval(
                autoplayTimer
            );

            autoplayTimer =
                null;
        }
    }


    function startAutoplay()
    {
        stopAutoplayTimer();

        if (
            !autoplayEnabled
            ||
            document.hidden
        ) {
            return;
        }

        autoplayTimer =
            window.setInterval(
                () => {

                    showSlide(
                        currentSlide + 1
                    );

                },
                AUTOPLAY_DELAY
            );
    }


    function pauseTemporarily()
    {
        stopAutoplayTimer();

        if (
            !autoplayEnabled
        ) {
            return;
        }

        if (
            resumeTimer
        ) {

            window.clearTimeout(
                resumeTimer
            );
        }

        resumeTimer =
            window.setTimeout(
                () => {

                    startAutoplay();

                },
                RESUME_DELAY
            );
    }


    function updatePauseButton()
    {
        if (!pauseButton) {
            return;
        }

        pauseButton.innerHTML =
            autoplayEnabled
                ?
                `
                    <i data-lucide="pause"></i>
                    <span>Berhenti Otomatis</span>
                `
                :
                `
                    <i data-lucide="play"></i>
                    <span>Mulai Otomatis</span>
                `;

        refreshIcons();
    }


    function toggleAutoplay()
    {
        autoplayEnabled =
            !autoplayEnabled;

        if (
            resumeTimer
        ) {

            window.clearTimeout(
                resumeTimer
            );

            resumeTimer =
                null;
        }

        if (
            autoplayEnabled
        ) {

            startAutoplay();

        } else {

            stopAutoplayTimer();
        }

        updatePauseButton();
    }


    /* =========================================================
       PREV / NEXT
    ========================================================= */

    prevButton?.addEventListener(
        'click',
        () => {

            userNavigate(
                currentSlide - 1
            );
        }
    );


    nextButton?.addEventListener(
        'click',
        () => {

            userNavigate(
                currentSlide + 1
            );
        }
    );


    pauseButton?.addEventListener(
        'click',
        toggleAutoplay
    );


    /* =========================================================
       THUMBNAIL
    ========================================================= */

    thumbnails.forEach(
        thumbnail => {

            thumbnail.addEventListener(
                'click',
                () => {

                    const target =
                        Number(
                            thumbnail
                                .dataset
                                .slideTarget
                        );

                    if (
                        Number.isNaN(
                            target
                        )
                    ) {
                        return;
                    }

                    userNavigate(
                        target
                    );
                }
            );
        }
    );


    /* =========================================================
       KEYBOARD
    ========================================================= */

    function handleKeyboard(
        event
    )
    {
        if (
            event.key === 'ArrowLeft'
        ) {

            event.preventDefault();

            userNavigate(
                currentSlide - 1
            );
        }

        if (
            event.key === 'ArrowRight'
        ) {

            event.preventDefault();

            userNavigate(
                currentSlide + 1
            );
        }
    }


    deck.addEventListener(
        'keydown',
        handleKeyboard
    );


    /*
     * Saat fullscreen, event keyboard juga dibaca dari document.
     */
    document.addEventListener(
        'keydown',
        event => {

            const fullscreen =
                document.fullscreenElement
                ||
                document.webkitFullscreenElement;

            if (
                fullscreen === deck
            ) {

                handleKeyboard(
                    event
                );
            }
        }
    );


    /* =========================================================
       SWIPE TABLET / TOUCH SCREEN
    =========================================================
       Pointer Events dipakai supaya bekerja di:
       - Android tablet
       - iPad modern
       - Windows touchscreen
       - browser desktop dengan mouse drag
    ========================================================= */

    function resetSwipe()
    {
        pointerStartX =
            null;

        pointerStartY =
            null;
    }


    function finishSwipe(
        event
    )
    {
        if (
            pointerStartX === null
            ||
            pointerStartY === null
        ) {
            return;
        }


        const dx =
            event.clientX
            -
            pointerStartX;

        const dy =
            event.clientY
            -
            pointerStartY;


        resetSwipe();


        /*
         * Gerakan terlalu pendek.
         */
        if (
            Math.abs(dx)
            <
            SWIPE_MIN_DISTANCE
        ) {
            return;
        }


        /*
         * Jika gerakan vertikal lebih dominan,
         * anggap sebagai scroll.
         */
        if (
            Math.abs(dx)
            <=
            Math.abs(dy)
        ) {
            return;
        }


        /*
         * Swipe ke kanan.
         */
        if (
            dx > 0
        ) {

            userNavigate(
                currentSlide - 1
            );

            return;
        }


        /*
         * Swipe ke kiri.
         */
        userNavigate(
            currentSlide + 1
        );
    }


    deck.addEventListener(
        'pointerdown',
        event => {

            /*
             * Kalau mouse,
             * hanya tombol kiri.
             */
            if (
                event.pointerType === 'mouse'
                &&
                event.button !== 0
            ) {
                return;
            }


            pointerStartX =
                event.clientX;

            pointerStartY =
                event.clientY;


            /*
             * Pointer capture membantu agar gesture
             * tidak putus saat jari keluar sedikit
             * dari dashboard.
             */
            if (
                typeof deck.setPointerCapture
                ===
                'function'
            ) {

                try {

                    deck.setPointerCapture(
                        event.pointerId
                    );

                } catch (_) {
                    // Tidak perlu melakukan apa-apa.
                }
            }
        },
        {
            passive: true
        }
    );


    deck.addEventListener(
        'pointerup',
        event => {

            finishSwipe(
                event
            );


            if (
                typeof deck.releasePointerCapture
                ===
                'function'
            ) {

                try {

                    deck.releasePointerCapture(
                        event.pointerId
                    );

                } catch (_) {
                    // Tidak perlu melakukan apa-apa.
                }
            }
        },
        {
            passive: true
        }
    );


    deck.addEventListener(
        'pointercancel',
        resetSwipe,
        {
            passive: true
        }
    );


    /* =========================================================
       FULLSCREEN / PRESENTATION MODE
    ========================================================= */

    function fullscreenElement()
    {
        return (
            document.fullscreenElement
            ||
            document.webkitFullscreenElement
            ||
            null
        );
    }


    function isDashboardFullscreen()
    {
        return (
            fullscreenElement()
            ===
            deck
        );
    }


    async function togglePresentation()
    {
        try {

            if (
                fullscreenElement()
            ) {

                if (
                    document.exitFullscreen
                ) {

                    await document
                        .exitFullscreen();

                } else if (
                    document.webkitExitFullscreen
                ) {

                    document
                        .webkitExitFullscreen();
                }

                return;
            }


            if (
                deck.requestFullscreen
            ) {

                await deck
                    .requestFullscreen();

            } else if (
                deck.webkitRequestFullscreen
            ) {

                deck
                    .webkitRequestFullscreen();
            }

        } catch (
            error
        ) {

            console.error(
                'Fullscreen error:',
                error
            );
        }
    }


    function updatePresentationButton()
    {
        const active =
            isDashboardFullscreen();


        document
            .documentElement
            .classList
            .toggle(
                'dashboard-presenting',
                active
            );


        document
            .body
            .classList
            .toggle(
                'dashboard-presenting',
                active
            );


        if (
            presentationButton
        ) {

            presentationButton
                .setAttribute(
                    'aria-pressed',
                    active
                        ?
                        'true'
                        :
                        'false'
                );


            presentationButton.innerHTML =
                active
                    ?
                    `
                        <i data-lucide="minimize"></i>
                        <span>Keluar Presentasi</span>
                    `
                    :
                    `
                        <i data-lucide="maximize-2"></i>
                        <span>Mode Presentasi</span>
                    `;
        }


        if (
            fullscreenInside
        ) {

            fullscreenInside.innerHTML =
                active
                    ?
                    '<i data-lucide="minimize"></i>'
                    :
                    '<i data-lucide="maximize-2"></i>';
        }


        /*
         * Ukuran chart berubah setelah fullscreen.
         * Render ulang setelah browser selesai resize.
         */
        window.setTimeout(
            () => {

                renderGrowthChart();

                renderLocationMap();

                refreshIcons();

            },
            120
        );
    }


    presentationButton?.addEventListener(
        'click',
        togglePresentation
    );


    fullscreenInside?.addEventListener(
        'click',
        togglePresentation
    );


    document.addEventListener(
        'fullscreenchange',
        updatePresentationButton
    );


    document.addEventListener(
        'webkitfullscreenchange',
        updatePresentationButton
    );


    /* =========================================================
       DATE & TIME WITA
    ========================================================= */

    function updateClock()
    {
        const dateElement =
            document.getElementById(
                'dashboardCurrentDate'
            );

        const timeElement =
            document.getElementById(
                'dashboardCurrentTime'
            );

        const now =
            new Date();


        if (
            dateElement
        ) {

            dateElement.textContent =
                new Intl.DateTimeFormat(
                    'id-ID',
                    {
                        timeZone:
                            'Asia/Makassar',

                        weekday:
                            'long',

                        day:
                            '2-digit',

                        month:
                            'long',

                        year:
                            'numeric',
                    }
                )
                .format(
                    now
                );
        }


        if (
            timeElement
        ) {

            timeElement.textContent =
                new Intl.DateTimeFormat(
                    'id-ID',
                    {
                        timeZone:
                            'Asia/Makassar',

                        hour:
                            '2-digit',

                        minute:
                            '2-digit',

                        second:
                            '2-digit',

                        hourCycle:
                            'h23',
                    }
                )
                .format(
                    now
                )
                .replace(
                    /\./g,
                    ':'
                )
                +
                ' WITA';
        }
    }


    updateClock();


    window.setInterval(
        updateClock,
        1000
    );


    /* =========================================================
       TAB VISIBILITY
    ========================================================= */

    document.addEventListener(
        'visibilitychange',
        () => {

            if (
                document.hidden
            ) {

                stopAutoplayTimer();

                return;
            }


            if (
                autoplayEnabled
            ) {

                startAutoplay();
            }
        }
    );


    /* =========================================================
       RESIZE
    ========================================================= */

    let resizeTimer =
        null;


    window.addEventListener(
        'resize',
        () => {

            window.clearTimeout(
                resizeTimer
            );


            resizeTimer =
                window.setTimeout(
                    () => {

                        renderGrowthChart();

                        renderLocationMap();

                    },
                    150
                );
        }
    );


    /* =========================================================
       INIT
    ========================================================= */

    showSlide(
        0
    );

    updatePauseButton();

    startAutoplay();

    updatePresentationButton();

    refreshIcons();
});


/* ============================================================
   ============================================================
   SLIDE 3 - GROWTH CHART
   ============================================================
============================================================ */

function renderGrowthChart()
{
    const svg =
        document.getElementById(
            'dashboardGrowthChart'
        );


    const stage =
        svg?.closest(
            '.growth-chart-stage'
        );


    const empty =
        document.getElementById(
            'dashboardGrowthEmpty'
        );


    const tooltip =
        document.getElementById(
            'dashboardGrowthTooltip'
        );


    const tooltipYear =
        document.getElementById(
            'dashboardGrowthTooltipYear'
        );


    const tooltipValue =
        document.getElementById(
            'dashboardGrowthTooltipValue'
        );


    const tooltipChange =
        document.getElementById(
            'dashboardGrowthTooltipChange'
        );


    const badge =
        document.getElementById(
            'dashboardGrowthBadge'
        );


    const badgeChange =
        document.getElementById(
            'dashboardGrowthChange'
        );


    if (
        !svg
        ||
        !stage
    ) {
        return;
    }


    /* =========================================================
       SOURCE DATA
    ========================================================= */

    const rawData =
        Array.isArray(
            window
                .ASSET_DASHBOARD_DATA
                ?.growth
        )
            ?
            window
                .ASSET_DASHBOARD_DATA
                .growth
            :
            [];


    /* =========================================================
       NORMALIZE PER YEAR
    ========================================================= */

    const yearlyMap =
        new Map();


    rawData.forEach(
        item => {

            const year =
                Number(
                    item?.tahun
                    ??
                    item?.year
                    ??
                    0
                );


            const value =
                Number(
                    item?.nilai
                    ??
                    item?.value
                    ??
                    0
                );


            const added =
                Number(
                    item?.tambahan
                    ??
                    0
                )
                ||
                0;


            if (
                !Number.isFinite(
                    year
                )
                ||
                year < 1900
                ||
                year > 2100
                ||
                !Number.isFinite(
                    value
                )
                ||
                value < 0
            ) {
                return;
            }


            /*
             * Jika tahun yang sama muncul lebih dari sekali,
             * pakai nilai tertinggi dari data cumulative.
             */
            if (
                !yearlyMap.has(
                    year
                )
                ||
                value >
                yearlyMap
                    .get(year)
                    .value
            ) {

                yearlyMap.set(
                    year,
                    {
                        year,
                        value,
                        added
                    }
                );
            }
        }
    );


    const points =
        Array
            .from(
                yearlyMap.values()
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    a.year
                    -
                    b.year
            );


    /* =========================================================
       RESET
    ========================================================= */

    svg.innerHTML =
        '';


    stage
        .querySelector(
            '.growth-x-axis-labels'
        )
        ?.remove();


    if (
        tooltip
    ) {

        tooltip.hidden =
            true;
    }


    if (
        badge
    ) {

        badge.hidden =
            true;

        badge.classList.remove(
            'is-up',
            'is-down',
            'is-flat'
        );
    }


    /* =========================================================
       EMPTY
    ========================================================= */

    if (
        !points.length
    ) {

        svg.style.display =
            'none';


        if (
            empty
        ) {

            empty.hidden =
                false;
        }


        return;
    }


    svg.style.display =
        'block';


    if (
        empty
    ) {

        empty.hidden =
            true;
    }


    /* =========================================================
       GROWTH BADGE
    ========================================================= */

    if (
        points.length >= 2
        &&
        badge
        &&
        badgeChange
    ) {

        const firstValue =
            points[0]
                .value;


        const lastValue =
            points[
                points.length - 1
            ]
                .value;


        let percentage =
            0;


        if (
            firstValue > 0
        ) {

            percentage =
                (
                    (
                        lastValue
                        -
                        firstValue
                    )
                    /
                    firstValue
                )
                *
                100;
        }


        const status =
            percentage > 0.05
                ?
                'is-up'
                :
                percentage < -0.05
                    ?
                    'is-down'
                    :
                    'is-flat';


        const sign =
            percentage > 0
                ?
                '+'
                :
                '';


        badge.hidden =
            false;


        badge.classList.add(
            status
        );


        badgeChange.textContent =
            `${sign}${percentage.toLocaleString(
                'id-ID',
                {
                    minimumFractionDigits:
                        1,

                    maximumFractionDigits:
                        1,
                }
            )}%`;


        const icon =
            badge.querySelector(
                'i'
            );


        if (
            icon
        ) {

            icon.setAttribute(
                'data-lucide',
                status === 'is-up'
                    ?
                    'trending-up'
                    :
                    status === 'is-down'
                        ?
                        'trending-down'
                        :
                        'minus'
            );
        }


        if (
            window.lucide
            &&
            typeof window.lucide.createIcons
            ===
            'function'
        ) {

            window.lucide
                .createIcons();
        }
    }


    /* =========================================================
       SVG CONFIG
    ========================================================= */

    const NS =
        'http://www.w3.org/2000/svg';


    const WIDTH =
        900;


    const HEIGHT =
        360;


    const padding = {
        top:
            48,

        right:
            54,

        bottom:
            58,

        left:
            105
    };


    const plotWidth =
        WIDTH
        -
        padding.left
        -
        padding.right;


    const plotHeight =
        HEIGHT
        -
        padding.top
        -
        padding.bottom;


    svg.setAttribute(
        'viewBox',
        `0 0 ${WIDTH} ${HEIGHT}`
    );


    svg.setAttribute(
        'preserveAspectRatio',
        'xMidYMid meet'
    );


    /* =========================================================
       SVG HELPER
    ========================================================= */

    function createSvgElement(
        tag,
        attributes = {}
    )
    {
        const element =
            document.createElementNS(
                NS,
                tag
            );


        Object.entries(
            attributes
        )
        .forEach(
            (
                [
                    key,
                    value
                ]
            ) => {

                element.setAttribute(
                    key,
                    String(
                        value
                    )
                );
            }
        );


        return element;
    }


    /* =========================================================
       VALUE RANGE
    ========================================================= */

    const values =
        points.map(
            item =>
                item.value
        );


    const rawMin =
        Math.min(
            ...values
        );


    const rawMax =
        Math.max(
            ...values
        );


    let difference =
        rawMax
        -
        rawMin;


    if (
        difference <= 0
    ) {

        difference =
            Math.max(
                rawMax * 0.15,
                1
            );
    }


    const extraSpace =
        Math.max(
            difference * 0.30,
            rawMax * 0.025,
            1
        );


    const chartMin =
        Math.max(
            0,
            rawMin - extraSpace
        );


    const chartMax =
        rawMax
        +
        extraSpace;


    /* =========================================================
       X POSITION
    ========================================================= */

    function getX(
        index
    )
    {
        if (
            points.length === 1
        ) {

            return (
                padding.left
                +
                plotWidth / 2
            );
        }


        return (
            padding.left
            +
            (
                index
                /
                (
                    points.length - 1
                )
            )
            *
            plotWidth
        );
    }


    /* =========================================================
       Y POSITION
    ========================================================= */

    function getY(
        value
    )
    {
        const range =
            Math.max(
                chartMax
                -
                chartMin,
                1
            );


        const ratio =
            (
                value
                -
                chartMin
            )
            /
            range;


        return (
            padding.top
            +
            plotHeight
            -
            ratio * plotHeight
        );
    }


    /* =========================================================
       GRADIENTS
    ========================================================= */

    const defs =
        createSvgElement(
            'defs'
        );


    const areaGradient =
        createSvgElement(
            'linearGradient',
            {
                id:
                    'growthAreaGradient',

                x1:
                    '0%',

                y1:
                    '0%',

                x2:
                    '0%',

                y2:
                    '100%'
            }
        );


    areaGradient.appendChild(
        createSvgElement(
            'stop',
            {
                offset:
                    '0%',

                'stop-color':
                    '#2583f3',

                'stop-opacity':
                    '.40'
            }
        )
    );


    areaGradient.appendChild(
        createSvgElement(
            'stop',
            {
                offset:
                    '55%',

                'stop-color':
                    '#2583f3',

                'stop-opacity':
                    '.16'
            }
        )
    );


    areaGradient.appendChild(
        createSvgElement(
            'stop',
            {
                offset:
                    '100%',

                'stop-color':
                    '#2583f3',

                'stop-opacity':
                    '.02'
            }
        )
    );


    defs.appendChild(
        areaGradient
    );


    const lineGradient =
        createSvgElement(
            'linearGradient',
            {
                id:
                    'growthLineGradient',

                x1:
                    '0%',

                y1:
                    '0%',

                x2:
                    '100%',

                y2:
                    '0%'
            }
        );


    lineGradient.appendChild(
        createSvgElement(
            'stop',
            {
                offset:
                    '0%',

                'stop-color':
                    '#0875e1'
            }
        )
    );


    lineGradient.appendChild(
        createSvgElement(
            'stop',
            {
                offset:
                    '100%',

                'stop-color':
                    '#55b1ff'
            }
        )
    );


    defs.appendChild(
        lineGradient
    );


    svg.appendChild(
        defs
    );


    /* =========================================================
       Y GRID
    ========================================================= */

    const GRID_COUNT =
        4;


    for (
        let i = 0;
        i <= GRID_COUNT;
        i++
    ) {

        const ratio =
            i
            /
            GRID_COUNT;


        const y =
            padding.top
            +
            ratio
            *
            plotHeight;


        const value =
            chartMax
            -
            ratio
            *
            (
                chartMax
                -
                chartMin
            );


        svg.appendChild(
            createSvgElement(
                'line',
                {
                    x1:
                        padding.left,

                    y1:
                        y,

                    x2:
                        WIDTH
                        -
                        padding.right,

                    y2:
                        y,

                    stroke:
                        '#55799a',

                    'stroke-opacity':
                        '.18',

                    'stroke-width':
                        1,

                    'stroke-dasharray':
                        '5 7'
                }
            )
        );


        const label =
            createSvgElement(
                'text',
                {
                    x:
                        padding.left
                        -
                        18,

                    y:
                        y
                        +
                        5,

                    'text-anchor':
                        'end',

                    fill:
                        '#55728f',

                    'font-size':
                        13,

                    'font-weight':
                        600
                }
            );


        /*
         * Function ini WAJIB ada.
         * Sebelumnya chart kosong karena helper ini hilang.
         */
        label.textContent =
            formatDashboardAxisCurrency(
                value
            );


        svg.appendChild(
            label
        );
    }


    /* =========================================================
       BASELINE
    ========================================================= */

    const baselineY =
        padding.top
        +
        plotHeight;


    svg.appendChild(
        createSvgElement(
            'line',
            {
                x1:
                    padding.left,

                y1:
                    baselineY,

                x2:
                    WIDTH
                    -
                    padding.right,

                y2:
                    baselineY,

                stroke:
                    '#6685a1',

                'stroke-opacity':
                    '.30',

                'stroke-width':
                    1.5
            }
        )
    );


    /* =========================================================
       POINT COORDINATES
    ========================================================= */

    const coordinates =
        points.map(
            (
                item,
                index
            ) => ({
                ...item,

                x:
                    getX(
                        index
                    ),

                y:
                    getY(
                        item.value
                    )
            })
        );


    /* =========================================================
       LINE PATH
    ========================================================= */

    function makeLinePath(
        items
    )
    {
        if (
            items.length === 1
        ) {
            return '';
        }


        /*
         * Dua titik = garis lurus.
         */
        if (
            items.length === 2
        ) {

            return (
                `M ${items[0].x} ${items[0].y}`
                +
                ` L ${items[1].x} ${items[1].y}`
            );
        }


        /*
         * 3+ titik = smooth curve.
         */
        let path =
            `M ${items[0].x} ${items[0].y}`;


        for (
            let i = 0;
            i <
            items.length - 1;
            i++
        ) {

            const current =
                items[i];


            const next =
                items[
                    i + 1
                ];


            const middleX =
                (
                    current.x
                    +
                    next.x
                )
                /
                2;


            path +=
                ` C ${middleX} ${current.y},`
                +
                ` ${middleX} ${next.y},`
                +
                ` ${next.x} ${next.y}`;
        }


        return path;
    }


    const linePath =
        makeLinePath(
            coordinates
        );


    /* =========================================================
       AREA + LINE
    ========================================================= */

    if (
        coordinates.length >= 2
    ) {

        const areaPath =
            linePath
            +
            ` L ${
                coordinates[
                    coordinates.length - 1
                ].x
            } ${baselineY}`
            +
            ` L ${
                coordinates[0].x
            } ${baselineY}`
            +
            ' Z';


        /*
         * Area biru.
         */
        svg.appendChild(
            createSvgElement(
                'path',
                {
                    d:
                        areaPath,

                    fill:
                        'url(#growthAreaGradient)',

                    class:
                        'growth-area-path'
                }
            )
        );


        /*
         * Glow putih.
         */
        svg.appendChild(
            createSvgElement(
                'path',
                {
                    d:
                        linePath,

                    fill:
                        'none',

                    stroke:
                        'rgba(255,255,255,.58)',

                    'stroke-width':
                        10,

                    'stroke-linecap':
                        'round',

                    'stroke-linejoin':
                        'round',

                    class:
                        'growth-line-glow'
                }
            )
        );


        /*
         * Garis utama.
         */
        svg.appendChild(
            createSvgElement(
                'path',
                {
                    d:
                        linePath,

                    fill:
                        'none',

                    stroke:
                        'url(#growthLineGradient)',

                    'stroke-width':
                        5,

                    'stroke-linecap':
                        'round',

                    'stroke-linejoin':
                        'round',

                    class:
                        'growth-line-path'
                }
            )
        );
    }


    /* =========================================================
       X AXIS YEAR
    ========================================================= */

    const xLabels =
        document.createElement(
            'div'
        );


    xLabels.className =
        'growth-x-axis-labels';


    coordinates.forEach(
        point => {

            const label =
                document.createElement(
                    'span'
                );


            label.className =
                'growth-x-axis-label';


            label.textContent =
                String(
                    point.year
                );


            label.style.left =
                `${
                    (
                        point.x
                        /
                        WIDTH
                    )
                    *
                    100
                }%`;


            xLabels.appendChild(
                label
            );
        }
    );


    stage.appendChild(
        xLabels
    );


    /* =========================================================
       TOOLTIP
    ========================================================= */

    function showTooltip(
        point,
        index
    )
    {
        if (
            !tooltip
            ||
            !tooltipYear
            ||
            !tooltipValue
        ) {
            return;
        }


        tooltipYear.textContent =
            `Tahun ${point.year}`;


        /*
         * Tooltip tetap angka database penuh.
         *
         * Contoh:
         * Rp 1.270.746.080.536
         */
        tooltipValue.textContent =
            formatDashboardRupiahFull(
                point.value
            );


        if (
            tooltipChange
        ) {

            /*
             * Titik pertama.
             */
            if (
                index === 0
            ) {

                tooltipChange.textContent =
                    'Periode awal pada grafik';


                tooltipChange.className =
                    '';

            } else {

                const previous =
                    coordinates[
                        index - 1
                    ]
                    .value;


                let percentage =
                    0;


                if (
                    previous > 0
                ) {

                    percentage =
                        (
                            (
                                point.value
                                -
                                previous
                            )
                            /
                            previous
                        )
                        *
                        100;
                }


                const sign =
                    percentage > 0
                        ?
                        '+'
                        :
                        '';


                tooltipChange.textContent =
                    `${sign}${percentage.toLocaleString(
                        'id-ID',
                        {
                            minimumFractionDigits:
                                1,

                            maximumFractionDigits:
                                1
                        }
                    )}% dari tahun sebelumnya`;


                tooltipChange.className =
                    percentage > 0.05
                        ?
                        'is-up'
                        :
                        percentage < -0.05
                            ?
                            'is-down'
                            :
                            'is-flat';
            }
        }


        tooltip.style.left =
            `${
                (
                    point.x
                    /
                    WIDTH
                )
                *
                100
            }%`;


        tooltip.style.top =
            `${
                (
                    point.y
                    /
                    HEIGHT
                )
                *
                100
            }%`;


        tooltip.hidden =
            false;
    }


    function hideTooltip()
    {
        if (
            tooltip
        ) {

            tooltip.hidden =
                true;
        }
    }


    /* =========================================================
       POINTS
    ========================================================= */

    coordinates.forEach(
        (
            point,
            index
        ) => {

            const group =
                createSvgElement(
                    'g',
                    {
                        class:
                            'growth-point-group',

                        tabindex:
                            '0',

                        role:
                            'button'
                    }
                );


            /*
             * Halo luar.
             */
            group.appendChild(
                createSvgElement(
                    'circle',
                    {
                        cx:
                            point.x,

                        cy:
                            point.y,

                        r:
                            15,

                        fill:
                            '#2583f3',

                        'fill-opacity':
                            '.14',

                        class:
                            'growth-point-halo'
                    }
                )
            );


            /*
             * Ring putih.
             */
            group.appendChild(
                createSvgElement(
                    'circle',
                    {
                        cx:
                            point.x,

                        cy:
                            point.y,

                        r:
                            8,

                        fill:
                            '#ffffff',

                        'fill-opacity':
                            '.95'
                    }
                )
            );


            /*
             * Titik biru.
             */
            group.appendChild(
                createSvgElement(
                    'circle',
                    {
                        cx:
                            point.x,

                        cy:
                            point.y,

                        r:
                            5,

                        fill:
                            '#2583f3',

                        stroke:
                            '#2583f3',

                        'stroke-width':
                            2,

                        class:
                            'growth-point-dot'
                    }
                )
            );


            /*
             * Invisible hit area supaya mudah disentuh
             * menggunakan jari di tablet.
             */
            group.appendChild(
                createSvgElement(
                    'circle',
                    {
                        cx:
                            point.x,

                        cy:
                            point.y,

                        r:
                            25,

                        fill:
                            'transparent',

                        cursor:
                            'pointer'
                    }
                )
            );


            group.addEventListener(
                'mouseenter',
                () => {

                    showTooltip(
                        point,
                        index
                    );
                }
            );


            group.addEventListener(
                'mouseleave',
                hideTooltip
            );


            group.addEventListener(
                'focus',
                () => {

                    showTooltip(
                        point,
                        index
                    );
                }
            );


            group.addEventListener(
                'blur',
                hideTooltip
            );


            /*
             * Penting untuk tablet.
             */
            group.addEventListener(
                'click',
                () => {

                    showTooltip(
                        point,
                        index
                    );
                }
            );


            svg.appendChild(
                group
            );
        }
    );
}


/* ============================================================
   ============================================================
   SLIDE 5 - LOCATION MAP
   ============================================================
============================================================ */

function renderLocationMap()
{
    const stage =
        document.getElementById(
            'dashboardMapStage'
        );


    const empty =
        document.getElementById(
            'dashboardMapEmpty'
        );


    if (!stage) {
        return;
    }


    /* =========================================================
       SOURCE
    ========================================================= */

    const source =
        Array.isArray(
            window
                .ASSET_DASHBOARD_DATA
                ?.locations
        )
            ?
            window
                .ASSET_DASHBOARD_DATA
                .locations
            :
            [];


    /* =========================================================
       NORMALIZE
    ========================================================= */

    const locations =
        source
            .map(
                location => ({

                    ...location,


                    latNumber:
                        parseDashboardCoordinate(
                            location?.lat
                        ),


                    longNumber:
                        parseDashboardCoordinate(
                            location?.long
                        ),


                    jumlahNumber:
                        Number(
                            location?.jumlah
                            ??
                            location?.total
                            ??
                            location?.count
                            ??
                            0
                        )
                        ||
                        0
                })
            )
            .filter(
                location =>

                    Number.isFinite(
                        location.latNumber
                    )

                    &&

                    Number.isFinite(
                        location.longNumber
                    )

                    &&

                    location.latNumber >= -90

                    &&

                    location.latNumber <= 90

                    &&

                    location.longNumber >= -180

                    &&

                    location.longNumber <= 180
            );


    stage.innerHTML =
        '';


    /* =========================================================
       EMPTY
    ========================================================= */

    if (
        !locations.length
    ) {

        if (
            empty
        ) {

            empty.hidden =
                false;
        }

        return;
    }


    if (
        empty
    ) {

        empty.hidden =
            true;
    }


    /* =========================================================
       BOUNDS
    ========================================================= */

    const lats =
        locations.map(
            item =>
                item.latNumber
        );


    const longs =
        locations.map(
            item =>
                item.longNumber
        );


    let minLat =
        Math.min(
            ...lats
        );


    let maxLat =
        Math.max(
            ...lats
        );


    let minLong =
        Math.min(
            ...longs
        );


    let maxLong =
        Math.max(
            ...longs
        );


    /*
     * Hindari pembagian nol.
     */
    if (
        minLat === maxLat
    ) {

        minLat -=
            0.01;

        maxLat +=
            0.01;
    }


    if (
        minLong === maxLong
    ) {

        minLong -=
            0.01;

        maxLong +=
            0.01;
    }


    const latSpan =
        maxLat
        -
        minLat;


    const longSpan =
        maxLong
        -
        minLong;


    const paddingPercent =
        8;


    /* =========================================================
       MARKERS
    ========================================================= */

    locations.forEach(
        (
            location,
            index
        ) => {

            const xRatio =
                (
                    location.longNumber
                    -
                    minLong
                )
                /
                longSpan;


            const yRatio =
                (
                    maxLat
                    -
                    location.latNumber
                )
                /
                latSpan;


            const left =
                paddingPercent
                +
                xRatio
                *
                (
                    100
                    -
                    paddingPercent
                    *
                    2
                );


            const top =
                paddingPercent
                +
                yRatio
                *
                (
                    100
                    -
                    paddingPercent
                    *
                    2
                );


            /* =================================================
               MARKER
            ================================================= */

            const marker =
                document.createElement(
                    'span'
                );


            marker.className =
                'map-marker';


            marker.style.left =
                `${left}%`;


            marker.style.top =
                `${top}%`;


            marker.title =
                `${
                    location.lokasi
                    ??
                    'Lokasi'
                } • ${
                    formatDashboardNumber(
                        location.jumlahNumber
                    )
                } aset`;


            stage.appendChild(
                marker
            );


            /* =================================================
               LABEL TOP 5
            ================================================= */

            if (
                index < 5
            ) {

                const label =
                    document.createElement(
                        'span'
                    );


                label.className =
                    'map-marker-label';


                /*
                 * Batasi agar label tidak terlalu keluar kanan.
                 */
                label.style.left =
                    `${
                        Math.min(
                            left,
                            76
                        )
                    }%`;


                label.style.top =
                    `${
                        Math.max(
                            8,
                            Math.min(
                                top,
                                92
                            )
                        )
                    }%`;


                label.textContent =
                    `${
                        location.lokasi
                        ??
                        'Lokasi'
                    } • ${
                        formatDashboardNumber(
                            location.jumlahNumber
                        )
                    } aset`;


                stage.appendChild(
                    label
                );
            }
        }
    );
}


/* ============================================================
   ============================================================
   HELPER
   ============================================================
============================================================ */


/* =========================================================
   PARSE COORDINATE
========================================================= */

function parseDashboardCoordinate(
    value
)
{
    if (
        value === null
        ||
        value === undefined
    ) {

        return NaN;
    }


    const normalized =
        String(
            value
        )
        .trim()
        .replace(
            ',',
            '.'
        )
        .replace(
            /[^0-9.\-]/g,
            ''
        );


    if (
        !normalized
    ) {

        return NaN;
    }


    return Number(
        normalized
    );
}


/* =========================================================
   NUMBER
========================================================= */

function formatDashboardNumber(
    value
)
{
    const number =
        Number(
            value
        );


    return new Intl.NumberFormat(
        'id-ID',
        {
            maximumFractionDigits:
                0
        }
    )
    .format(
        Number.isFinite(
            number
        )
            ?
            number
            :
            0
    );
}


/* =========================================================
   FULL RUPIAH
   Tooltip chart menggunakan angka penuh dari database.

   1270746080536
   =>
   Rp 1.270.746.080.536
========================================================= */

function formatDashboardRupiahFull(
    value
)
{
    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return 'Rp 0';
    }


    return (
        'Rp '
        +
        new Intl.NumberFormat(
            'id-ID',
            {
                useGrouping:
                    true,

                minimumFractionDigits:
                    0,

                maximumFractionDigits:
                    0
            }
        )
        .format(
            number
        )
    );
}


/* =========================================================
   TRUNCATE
   Bukan pembulatan.

   1.2799 -> 1.27
========================================================= */

function truncateDashboardNumber(
    value,
    precision = 2
)
{
    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return 0;
    }


    const factor =
        Math.pow(
            10,
            precision
        );


    /*
     * Positif.
     */
    if (
        number >= 0
    ) {

        return (
            Math.floor(
                number
                *
                factor
            )
            /
            factor
        );
    }


    /*
     * Negatif.
     */
    return (
        Math.ceil(
            number
            *
            factor
        )
        /
        factor
    );
}


/* =========================================================
   AXIS CURRENCY
   Wajib dipakai oleh renderGrowthChart().

   Contoh:
   Rp 1,27 T
   Rp 1,14 T
   Rp 966,4 M

   Tidak membulatkan ke Rp 1,3 T.
========================================================= */

function formatDashboardAxisCurrency(
    value
)
{
    const number =
        Number(
            value
        )
        ||
        0;


    /* =====================================================
       TRILIUN
    ===================================================== */

    if (
        Math.abs(
            number
        )
        >=
        1000000000000
    ) {

        const result =
            truncateDashboardNumber(
                number
                /
                1000000000000,
                2
            );


        return (
            'Rp '
            +
            result.toLocaleString(
                'id-ID',
                {
                    minimumFractionDigits:
                        2,

                    maximumFractionDigits:
                        2
                }
            )
            +
            ' T'
        );
    }


    /* =====================================================
       MILIAR
    ===================================================== */

    if (
        Math.abs(
            number
        )
        >=
        1000000000
    ) {

        const result =
            truncateDashboardNumber(
                number
                /
                1000000000,
                1
            );


        return (
            'Rp '
            +
            result.toLocaleString(
                'id-ID',
                {
                    minimumFractionDigits:
                        1,

                    maximumFractionDigits:
                        1
                }
            )
            +
            ' M'
        );
    }


    /* =====================================================
       JUTA
    ===================================================== */

    if (
        Math.abs(
            number
        )
        >=
        1000000
    ) {

        const result =
            truncateDashboardNumber(
                number
                /
                1000000,
                1
            );


        return (
            'Rp '
            +
            result.toLocaleString(
                'id-ID',
                {
                    minimumFractionDigits:
                        1,

                    maximumFractionDigits:
                        1
                }
            )
            +
            ' Jt'
        );
    }


    /* =====================================================
       NORMAL
    ===================================================== */

    return (
        'Rp '
        +
        new Intl.NumberFormat(
            'id-ID',
            {
                maximumFractionDigits:
                    0
            }
        )
        .format(
            number
        )
    );
}


/* =========================================================
   COMPACT PRECISE
   Digunakan jika suatu elemen JS membutuhkan singkatan
   tanpa pembulatan.

   1.270.746.080.536
   =>
   Rp 1,27 T

   1.279.999.999.999
   =>
   Rp 1,27 T

   Bukan Rp 1,28 T.
========================================================= */

function formatDashboardCompactPrecise(
    value,
    currency = true
)
{
    const number =
        Number(
            value
        )
        ||
        0;


    const prefix =
        currency
            ?
            'Rp '
            :
            '';


    /* =====================================================
       TRILIUN
    ===================================================== */

    if (
        Math.abs(
            number
        )
        >=
        1000000000000
    ) {

        const result =
            truncateDashboardNumber(
                number
                /
                1000000000000,
                2
            );


        return (
            prefix
            +
            result.toLocaleString(
                'id-ID',
                {
                    minimumFractionDigits:
                        2,

                    maximumFractionDigits:
                        2
                }
            )
            +
            ' T'
        );
    }


    /* =====================================================
       MILIAR
    ===================================================== */

    if (
        Math.abs(
            number
        )
        >=
        1000000000
    ) {

        const result =
            truncateDashboardNumber(
                number
                /
                1000000000,
                2
            );


        return (
            prefix
            +
            result.toLocaleString(
                'id-ID',
                {
                    minimumFractionDigits:
                        2,

                    maximumFractionDigits:
                        2
                }
            )
            +
            ' M'
        );
    }


    /* =====================================================
       JUTA
    ===================================================== */

    if (
        Math.abs(
            number
        )
        >=
        1000000
    ) {

        const result =
            truncateDashboardNumber(
                number
                /
                1000000,
                2
            );


        return (
            prefix
            +
            result.toLocaleString(
                'id-ID',
                {
                    minimumFractionDigits:
                        2,

                    maximumFractionDigits:
                        2
                }
            )
            +
            ' Jt'
        );
    }


    /* =====================================================
       RIBU
    ===================================================== */

    if (
        Math.abs(
            number
        )
        >=
        1000
    ) {

        const result =
            truncateDashboardNumber(
                number
                /
                1000,
                2
            );


        return (
            prefix
            +
            result.toLocaleString(
                'id-ID',
                {
                    minimumFractionDigits:
                        2,

                    maximumFractionDigits:
                        2
                }
            )
            +
            ' Rb'
        );
    }


    /* =====================================================
       NORMAL
    ===================================================== */

    return (
        prefix
        +
        new Intl.NumberFormat(
            'id-ID',
            {
                maximumFractionDigits:
                    0
            }
        )
        .format(
            number
        )
    );
}


/* =========================================================
   LEGACY COMPACT
   Supaya kode lama yang masih memanggil function ini
   tidak menghasilkan error.
========================================================= */

function formatDashboardCompact(
    value,
    currency = true
)
{
    return formatDashboardCompactPrecise(
        value,
        currency
    );
}