'use strict';

/* =========================================================
   SISTEM ASET - DASHBOARD

   FITUR:
   - Animasi perpindahan slide
   - Autoplay setiap 8 detik
   - Resume 15 detik setelah interaksi
   - Previous / Next
   - Dots
   - Thumbnail
   - Keyboard arrow
   - Swipe tablet / touchscreen
   - Mouse drag
   - Pause / Play
   - Fullscreen / Mode Presentasi
   - WITA Clock
   - Growth Chart Slide 3
   - Tooltip nominal penuh
   - Location Map Slide 5
========================================================= */


document.addEventListener(
    'DOMContentLoaded',
    () => {

        /* =====================================================
           ELEMENT UTAMA
        ===================================================== */

        const deck =
            document.getElementById(
                'dashboardDeck'
            );


        if (!deck) {
            return;
        }


        /*
         * Area ini SAJA yang digunakan untuk swipe.
         *
         * Jangan menggunakan seluruh dashboardDeck karena
         * tombol-tombol navigasi juga berada di dalam deck.
         */
        const slideStage =
            deck.querySelector(
                '.dashboard-slide-stage'
            );


        const swipeSurface =
            slideStage
            ||
            deck;


        const slides =
            Array.from(
                deck.querySelectorAll(
                    '.dashboard-slide'
                )
            );


        const thumbnails =
            Array.from(
                deck.querySelectorAll(
                    '.dashboard-thumbnail'
                )
            );


        const dotsContainer =
            document.getElementById(
                'dashboardDots'
            );


        const prevButton =
            document.getElementById(
                'dashboardPrev'
            );


        const nextButton =
            document.getElementById(
                'dashboardNext'
            );


        const pauseButton =
            document.getElementById(
                'dashboardPauseButton'
            );


        const presentationButton =
            document.getElementById(
                'dashboardPresentationButton'
            );


        const fullscreenInside =
            document.getElementById(
                'dashboardFullscreenInside'
            );


        /* =====================================================
           CONFIG
        ===================================================== */

        const AUTOPLAY_DELAY =
            8000;


        const RESUME_DELAY =
            15000;


        const SWIPE_MIN_DISTANCE =
            52;


        /* =====================================================
           STATE
        ===================================================== */

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


        let swipePointerId =
            null;


        /* =====================================================
           ICON
        ===================================================== */

        function refreshIcons()
        {
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


        /* =====================================================
           CREATE DOTS
        ===================================================== */

        if (
            dotsContainer
        ) {

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
                        event => {

                            event.preventDefault();

                            event.stopPropagation();


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
                dotsContainer
                    ?.children
                ||
                []
            );


        /* =====================================================
           NORMALIZE SLIDE INDEX
        ===================================================== */

        function normalizeSlideIndex(
            index
        )
        {
            if (
                !slides.length
            ) {

                return 0;
            }


            if (
                index < 0
            ) {

                return (
                    slides.length
                    -
                    1
                );
            }


            if (
                index
                >=
                slides.length
            ) {

                return 0;
            }


            return index;
        }


        /* =====================================================
           SHOW SLIDE
        ===================================================== */

        function showSlide(
            index,
            userInteraction = false
        )
        {
            if (
                !slides.length
            ) {

                return;
            }


            const previousSlide =
                currentSlide;


            currentSlide =
                normalizeSlideIndex(
                    index
                );


            /*
             * Dipakai CSS untuk menentukan arah animasi.
             */
            deck.dataset.direction =
                currentSlide
                <
                previousSlide
                    ?
                    'prev'
                    :
                    'next';


            /* =================================================
               SLIDES
            ================================================= */

            slides.forEach(
                (
                    slide,
                    slideIndex
                ) => {

                    const active =
                        slideIndex
                        ===
                        currentSlide;


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


            /* =================================================
               THUMBNAILS
            ================================================= */

            thumbnails.forEach(
                (
                    button,
                    buttonIndex
                ) => {

                    const active =
                        buttonIndex
                        ===
                        currentSlide;


                    button.classList.toggle(
                        'is-active',
                        active
                    );


                    button.setAttribute(
                        'aria-current',
                        active
                            ?
                            'true'
                            :
                            'false'
                    );
                }
            );


            /* =================================================
               DOTS
            ================================================= */

            dots.forEach(
                (
                    dot,
                    dotIndex
                ) => {

                    dot.classList.toggle(
                        'is-active',
                        dotIndex
                        ===
                        currentSlide
                    );
                }
            );


            /*
             * Interaksi manual:
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


        /* =====================================================
           AUTOPLAY
        ===================================================== */

        function stopAutoplayTimer()
        {
            if (
                !autoplayTimer
            ) {

                return;
            }


            window.clearInterval(
                autoplayTimer
            );


            autoplayTimer =
                null;
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
                            currentSlide + 1,
                            false
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

                        resumeTimer =
                            null;


                        startAutoplay();

                    },
                    RESUME_DELAY
                );
        }


        /* =====================================================
           PAUSE / PLAY BUTTON
        ===================================================== */

        function updatePauseButton()
        {
            if (
                !pauseButton
            ) {

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


            pauseButton.setAttribute(
                'aria-pressed',
                autoplayEnabled
                    ?
                    'false'
                    :
                    'true'
            );


            refreshIcons();
        }


        function toggleAutoplay(
            event
        )
        {
            if (
                event
            ) {

                event.preventDefault();

                event.stopPropagation();
            }


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


        /* =====================================================
           PREVIOUS BUTTON

           Click handler berdiri sendiri supaya tidak
           terganggu event swipe.
        ===================================================== */

        if (
            prevButton
        ) {

            prevButton.addEventListener(
                'click',
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    userNavigate(
                        currentSlide - 1
                    );
                }
            );
        }


        /* =====================================================
           NEXT BUTTON
        ===================================================== */

        if (
            nextButton
        ) {

            nextButton.addEventListener(
                'click',
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    userNavigate(
                        currentSlide + 1
                    );
                }
            );
        }


        /* =====================================================
           PAUSE BUTTON
        ===================================================== */

        if (
            pauseButton
        ) {

            pauseButton.addEventListener(
                'click',
                toggleAutoplay
            );
        }


        /* =====================================================
           THUMBNAILS
        ===================================================== */

        thumbnails.forEach(
            button => {

                button.addEventListener(
                    'click',
                    event => {

                        event.preventDefault();

                        event.stopPropagation();


                        const target =
                            Number(
                                button
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


        /* =====================================================
           KEYBOARD
        ===================================================== */

        function handleKeyboard(
            event
        )
        {
            if (
                event.key
                ===
                'ArrowLeft'
            ) {

                event.preventDefault();


                userNavigate(
                    currentSlide - 1
                );
            }


            if (
                event.key
                ===
                'ArrowRight'
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
         * Keyboard ketika fullscreen.
         */
        document.addEventListener(
            'keydown',
            event => {

                const fullscreen =
                    document.fullscreenElement
                    ||
                    document.webkitFullscreenElement;


                if (
                    fullscreen
                    ===
                    deck
                ) {

                    handleKeyboard(
                        event
                    );
                }
            }
        );


        /* =====================================================
           SWIPE TABLET / TOUCH / MOUSE
        =====================================================

           PERBAIKAN UTAMA:

           Swipe sekarang HANYA bekerja pada:

               .dashboard-slide-stage

           BUKAN seluruh:

               #dashboardDeck

           Jadi mouse/pointer tidak lagi mengambil event klik
           dari tombol Previous, Next, Pause dan Fullscreen.
        ===================================================== */


        /*
         * Jangan mulai swipe jika user menyentuh
         * elemen interaktif.
         */
        function isInteractiveTarget(
            target
        )
        {
            if (
                !(
                    target
                    instanceof
                    Element
                )
            ) {

                return false;
            }


            return Boolean(
                target.closest(
                    [
                        'button',
                        'a',
                        'input',
                        'select',
                        'textarea',
                        '[role="button"]',
                        '.growth-chart-tooltip',
                        '.map-marker-label'
                    ]
                    .join(
                        ','
                    )
                )
            );
        }


        function resetSwipe()
        {
            pointerStartX =
                null;


            pointerStartY =
                null;


            swipePointerId =
                null;
        }


        function releaseSwipePointer(
            pointerId
        )
        {
            if (
                pointerId === null
                ||
                pointerId === undefined
                ||
                typeof
                    swipeSurface
                        .releasePointerCapture
                    !==
                    'function'
            ) {

                return;
            }


            try {

                if (
                    typeof
                        swipeSurface
                            .hasPointerCapture
                        !==
                        'function'
                    ||
                    swipeSurface
                        .hasPointerCapture(
                            pointerId
                        )
                ) {

                    swipeSurface
                        .releasePointerCapture(
                            pointerId
                        );
                }

            } catch (_) {

                /*
                 * Tidak fatal.
                 */
            }
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

                resetSwipe();

                return;
            }


            /*
             * Abaikan pointer yang bukan pointer
             * yang memulai gesture.
             */
            if (
                swipePointerId !== null
                &&
                event.pointerId
                !==
                swipePointerId
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
             * Gesture terlalu pendek.
             */
            if (
                Math.abs(
                    dx
                )
                <
                SWIPE_MIN_DISTANCE
            ) {

                return;
            }


            /*
             * Kalau vertical movement lebih besar,
             * berarti user sedang scroll.
             */
            if (
                Math.abs(
                    dx
                )
                <=
                Math.abs(
                    dy
                )
            ) {

                return;
            }


            /*
             * Swipe kanan.
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
             * Swipe kiri.
             */
            userNavigate(
                currentSlide + 1
            );
        }


        /* =====================================================
           POINTER DOWN
        ===================================================== */

        swipeSurface.addEventListener(
            'pointerdown',
            event => {

                /*
                 * Mouse hanya tombol kiri.
                 */
                if (
                    event.pointerType
                    ===
                    'mouse'
                    &&
                    event.button
                    !==
                    0
                ) {

                    return;
                }


                /*
                 * Jangan mulai swipe dari tombol,
                 * link, input atau titik chart.
                 */
                if (
                    isInteractiveTarget(
                        event.target
                    )
                ) {

                    resetSwipe();

                    return;
                }


                pointerStartX =
                    event.clientX;


                pointerStartY =
                    event.clientY;


                swipePointerId =
                    event.pointerId;


                /*
                 * Pointer capture hanya dilakukan pada
                 * slideStage. Bukan pada seluruh deck.
                 */
                if (
                    typeof
                        swipeSurface
                            .setPointerCapture
                        ===
                        'function'
                ) {

                    try {

                        swipeSurface
                            .setPointerCapture(
                                event.pointerId
                            );

                    } catch (_) {

                        /*
                         * Browser boleh mengabaikannya.
                         */
                    }
                }
            },
            {
                passive:
                    true
            }
        );


        /* =====================================================
           POINTER UP
        ===================================================== */

        swipeSurface.addEventListener(
            'pointerup',
            event => {

                const capturedPointerId =
                    swipePointerId;


                finishSwipe(
                    event
                );


                releaseSwipePointer(
                    capturedPointerId
                );
            },
            {
                passive:
                    true
            }
        );


        /* =====================================================
           POINTER CANCEL
        ===================================================== */

        swipeSurface.addEventListener(
            'pointercancel',
            () => {

                const capturedPointerId =
                    swipePointerId;


                resetSwipe();


                releaseSwipePointer(
                    capturedPointerId
                );
            },
            {
                passive:
                    true
            }
        );


        swipeSurface.addEventListener(
            'lostpointercapture',
            resetSwipe,
            {
                passive:
                    true
            }
        );


        /* =====================================================
           PROTEKSI CONTROL BUTTONS

           Event pointer dari tombol tidak boleh dianggap
           gesture swipe.
        ===================================================== */

        [
            prevButton,
            nextButton,
            pauseButton,
            fullscreenInside,
            presentationButton,
            ...dots,
            ...thumbnails
        ]
        .filter(
            Boolean
        )
        .forEach(
            control => {

                control.addEventListener(
                    'pointerdown',
                    event => {

                        event.stopPropagation();
                    }
                );
            }
        );


        /* =====================================================
           FULLSCREEN
        ===================================================== */

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


        async function togglePresentation(
            event
        )
        {
            if (
                event
            ) {

                event.preventDefault();

                event.stopPropagation();
            }


            try {

                /*
                 * Keluar fullscreen.
                 */
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


                /*
                 * Masuk fullscreen.
                 */
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


            /* =================================================
               TOP PRESENTATION BUTTON
            ================================================= */

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


            /* =================================================
               BOTTOM FULLSCREEN BUTTON
            ================================================= */

            if (
                fullscreenInside
            ) {

                fullscreenInside
                    .setAttribute(
                        'aria-pressed',
                        active
                            ?
                            'true'
                            :
                            'false'
                    );


                fullscreenInside.innerHTML =
                    active
                        ?
                        '<i data-lucide="minimize"></i>'
                        :
                        '<i data-lucide="maximize-2"></i>';
            }


            /*
             * Ukuran dashboard berubah ketika fullscreen.
             * Chart dan map dirender ulang.
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


        /* =====================================================
           PRESENTATION BUTTON TOP
        ===================================================== */

        if (
            presentationButton
        ) {

            presentationButton.addEventListener(
                'click',
                togglePresentation
            );
        }


        /* =====================================================
           FULLSCREEN BUTTON BOTTOM
        ===================================================== */

        if (
            fullscreenInside
        ) {

            fullscreenInside.addEventListener(
                'click',
                togglePresentation
            );
        }


        document.addEventListener(
            'fullscreenchange',
            updatePresentationButton
        );


        document.addEventListener(
            'webkitfullscreenchange',
            updatePresentationButton
        );


        /* =====================================================
           DATE & TIME WITA
        ===================================================== */

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
                                'numeric'
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
                                'h23'
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


        /* =====================================================
           PAGE VISIBILITY
        ===================================================== */

        document.addEventListener(
            'visibilitychange',
            () => {

                if (
                    document.hidden
                ) {

                    stopAutoplayTimer();

                } else if (
                    autoplayEnabled
                ) {

                    startAutoplay();
                }
            }
        );


        /* =====================================================
           RESIZE
        ===================================================== */

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


        /* =====================================================
           INITIALIZE
        ===================================================== */

        showSlide(
            0,
            false
        );


        updatePauseButton();


        startAutoplay();


        updatePresentationButton();


        refreshIcons();
    }
);


/* ============================================================
   ============================================================
   SLIDE 3
   GROWTH CHART
   ============================================================
============================================================ */

function renderGrowthChart()
{
    const svg =
        document.getElementById(
            'dashboardGrowthChart'
        );


    const stage =
        svg
            ?.closest(
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


    /* =====================================================
       DATA FROM DATABASE
    ===================================================== */

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
             * Jika terdapat data tahun yang sama,
             * gunakan nilai cumulative tertinggi.
             */
            if (
                !yearlyMap.has(
                    year
                )
                ||
                value
                >
                yearlyMap
                    .get(
                        year
                    )
                    .value
            ) {

                yearlyMap.set(
                    year,
                    {
                        year:
                            year,

                        value:
                            value,

                        added:
                            added
                    }
                );
            }
        }
    );


    const points =
        Array.from(
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


    /* =====================================================
       RESET
    ===================================================== */

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


    /* =====================================================
       EMPTY
    ===================================================== */

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


    /* =====================================================
       GROWTH BADGE
    ===================================================== */

    if (
        points.length
        >=
        2
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
                points.length
                -
                1
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
                        1
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

                status
                ===
                'is-up'
                    ?
                    'trending-up'
                    :
                    status
                    ===
                    'is-down'
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


    /* =====================================================
       SVG CONFIG
    ===================================================== */

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


    /* =====================================================
       SVG ELEMENT HELPER
    ===================================================== */

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


    /* =====================================================
       CHART RANGE
    ===================================================== */

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
                rawMax
                *
                0.15,
                1
            );
    }


    const extraSpace =
        Math.max(
            difference
            *
            0.30,

            rawMax
            *
            0.025,

            1
        );


    const chartMin =
        Math.max(
            0,
            rawMin
            -
            extraSpace
        );


    const chartMax =
        rawMax
        +
        extraSpace;


    /* =====================================================
       X POSITION
    ===================================================== */

    function getX(
        index
    )
    {
        if (
            points.length
            ===
            1
        ) {

            return (
                padding.left
                +
                plotWidth
                /
                2
            );
        }


        return (
            padding.left
            +
            (
                index
                /
                (
                    points.length
                    -
                    1
                )
            )
            *
            plotWidth
        );
    }


    /* =====================================================
       Y POSITION
    ===================================================== */

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
            (
                ratio
                *
                plotHeight
            )
        );
    }


    /* =====================================================
       SVG DEFINITIONS
    ===================================================== */

    const defs =
        createSvgElement(
            'defs'
        );


    /* =====================================================
       AREA GRADIENT
    ===================================================== */

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


    /* =====================================================
       LINE GRADIENT
    ===================================================== */

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


    /* =====================================================
       Y GRID
    ===================================================== */

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
            (
                ratio
                *
                plotHeight
            );


        const value =
            chartMax
            -
            (
                ratio
                *
                (
                    chartMax
                    -
                    chartMin
                )
            );


        /* =================================================
           GRID LINE
        ================================================= */

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


        /* =================================================
           Y LABEL
        ================================================= */

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


        label.textContent =
            formatDashboardAxisCurrency(
                value
            );


        svg.appendChild(
            label
        );
    }


    /* =====================================================
       BASELINE
    ===================================================== */

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


    /* =====================================================
       COORDINATES
    ===================================================== */

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


    /* =====================================================
       LINE PATH
    ===================================================== */

    function makeLinePath(
        items
    )
    {
        if (
            items.length
            ===
            1
        ) {

            return '';
        }


        if (
            items.length
            ===
            2
        ) {

            return (
                `M ${items[0].x} ${items[0].y}`
                +
                ` L ${items[1].x} ${items[1].y}`
            );
        }


        let path =
            `M ${items[0].x} ${items[0].y}`;


        for (
            let i = 0;
            i <
            items.length
            -
            1;
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


    /* =====================================================
       AREA + LINE
    ===================================================== */

    if (
        coordinates.length
        >=
        2
    ) {

        const areaPath =
            linePath
            +
            ` L ${
                coordinates[
                    coordinates.length
                    -
                    1
                ].x
            } ${baselineY}`
            +
            ` L ${
                coordinates[0].x
            } ${baselineY}`
            +
            ' Z';


        /* =================================================
           AREA
        ================================================= */

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


        /* =================================================
           WHITE GLOW
        ================================================= */

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


        /* =================================================
           BLUE LINE
        ================================================= */

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


    /* =====================================================
       X AXIS LABELS
    ===================================================== */

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


    /* =====================================================
       TOOLTIP
    ===================================================== */

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
         * Nilai database FULL.
         */
        tooltipValue.textContent =
            formatDashboardRupiahFull(
                point.value
            );


        if (
            tooltipChange
        ) {

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
                        index
                        -
                        1
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


    /* =====================================================
       CHART POINTS
    ===================================================== */

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


            /* =================================================
               HALO
            ================================================= */

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


            /* =================================================
               WHITE RING
            ================================================= */

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


            /* =================================================
               BLUE POINT
            ================================================= */

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
             * Hit area lebih besar untuk tablet.
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
             * Tablet tap.
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
   SLIDE 5
   LOCATION MAP
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


    if (
        !stage
    ) {

        return;
    }


    /* =====================================================
       SOURCE
    ===================================================== */

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


    /* =====================================================
       NORMALIZE
    ===================================================== */

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

                location.latNumber
                >=
                -90

                &&

                location.latNumber
                <=
                90

                &&

                location.longNumber
                >=
                -180

                &&

                location.longNumber
                <=
                180
        );


    stage.innerHTML =
        '';


    /* =====================================================
       EMPTY
    ===================================================== */

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


    /* =====================================================
       LAT LONG BOUNDS
    ===================================================== */

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


    /* =====================================================
       MARKERS
    ===================================================== */

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
                (
                    xRatio
                    *
                    (
                        100
                        -
                        paddingPercent
                        *
                        2
                    )
                );


            const top =
                paddingPercent
                +
                (
                    yRatio
                    *
                    (
                        100
                        -
                        paddingPercent
                        *
                        2
                    )
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
   FORMAT NUMBER
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
   FORMAT FULL RUPIAH

   1.270.746.080.536
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

   BUKAN ROUND.

   1.2799
   =>
   1.27
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
   FORMAT AXIS CURRENCY

   Digunakan pada Y Axis chart.

   1.270.746.080.536
   =>
   Rp 1,27 T

   Tidak dibulatkan menjadi 1,3 T.
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


    const abs =
        Math.abs(
            number
        );


    /* =====================================================
       TRILIUN
    ===================================================== */

    if (
        abs
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
        abs
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
        abs
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
   FORMAT COMPACT PRESISI

   1.270.746.080.536
   =>
   Rp 1,27 T

   1.279.999.999.999
   =>
   Rp 1,27 T

   BUKAN:
   Rp 1,28 T
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


    const abs =
        Math.abs(
            number
        );


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
        abs
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
        abs
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
        abs
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
        abs
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


    return (
        prefix
        +
        formatDashboardNumber(
            number
        )
    );
}


/* =========================================================
   LEGACY FORMATTER

   Supaya function lama yang masih memanggil
   formatDashboardCompact() tidak error.
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