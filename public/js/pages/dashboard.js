'use strict';


/* =========================================================
   DASHBOARD CONFIG
========================================================= */

const DASHBOARD = {

    autoplayDelay:
        8000,

    resumeDelay:
        15000,

    swipeMinDistance:
        52,

    transitionMs:
        680,

};


/* =========================================================
   DASHBOARD INITIALIZATION
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        const deck =
            document.getElementById(
                'dashboardDeck'
            );


        if (
            !deck
        ) {
            return;
        }


        const slideStage =
            deck.querySelector(
                '.dashboard-slide-stage'
            );


        /*
         * Swipe hanya bekerja pada isi slide.
         *
         * Bukan pada seluruh deck.
         *
         * Ini membuat tombol:
         *
         * - Previous
         * - Next
         * - Pause
         * - Fullscreen
         * - Thumbnail
         *
         * tetap bisa diklik normal di laptop.
         */
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


        let transitionTimer =
            null;


        let initialized =
            false;


        /* =====================================================
           ICON
        ===================================================== */

        const refreshIcons =
            () => {

                if (
                    window.lucide
                    &&
                    typeof
                        window.lucide
                            .createIcons
                    ===
                    'function'
                ) {

                    window.lucide
                        .createIcons();
                }
            };


        /* =====================================================
           DOTS
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
           NORMALIZE INDEX
        ===================================================== */

        const normalizeIndex =
            index => {

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
            };


        /* =====================================================
           CLEAR MOTION CLASS
        ===================================================== */

        const clearMotionClasses =
            () => {

                slides.forEach(
                    slide => {

                        slide.classList.remove(

                            'is-entering-from-right',

                            'is-entering-from-left',

                            'is-leaving-to-left',

                            'is-leaving-to-right'

                        );
                    }
                );


                slideStage
                    ?.classList
                    .remove(
                        'is-transitioning'
                    );
            };


        /* =====================================================
           DIRECTION
        ===================================================== */

        const inferDirection =
            (
                targetIndex,
                requestedIndex,
                hint = null
            ) => {

                if (
                    hint === 'prev'
                    ||
                    hint === 'next'
                ) {

                    return hint;
                }


                if (
                    !slides.length
                ) {

                    return 'next';
                }


                /*
                 * Last -> First
                 */
                if (
                    currentSlide
                    ===
                    slides.length
                    -
                    1
                    &&
                    targetIndex
                    ===
                    0
                ) {

                    return 'next';
                }


                /*
                 * First -> Last
                 */
                if (
                    currentSlide
                    ===
                    0
                    &&
                    targetIndex
                    ===
                    slides.length
                    -
                    1
                ) {

                    return 'prev';
                }


                return requestedIndex
                    <
                    currentSlide
                        ?
                        'prev'
                        :
                        'next';
            };


        /* =====================================================
           SHOW SLIDE
        ===================================================== */

        function showSlide(
            index,
            userInteraction = false,
            directionHint = null
        )
        {
            if (
                !slides.length
            ) {

                return;
            }


            const targetIndex =
                normalizeIndex(
                    index
                );


            const previousIndex =
                currentSlide;


            const previousSlide =
                slides[
                    previousIndex
                ];


            const nextSlide =
                slides[
                    targetIndex
                ];


            /* =================================================
               FIRST RENDER
            ================================================= */

            if (
                !initialized
            ) {

                currentSlide =
                    targetIndex;


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


                initialized =
                    true;

            }


            /* =================================================
               TRANSITION
            ================================================= */

            else if (
                targetIndex
                !==
                previousIndex
            ) {

                const direction =
                    inferDirection(

                        targetIndex,

                        index,

                        directionHint

                    );


                currentSlide =
                    targetIndex;


                deck.dataset.direction =
                    direction;


                if (
                    transitionTimer
                ) {

                    clearTimeout(
                        transitionTimer
                    );


                    transitionTimer =
                        null;
                }


                clearMotionClasses();


                /*
                 * Slide lama tidak langsung dihilangkan.
                 *
                 * Slide lama dan baru overlap saat animasi.
                 *
                 * Karena background slide tidak ikut
                 * translate, tidak akan muncul ruang putih.
                 */

                previousSlide
                    .classList
                    .remove(
                        'is-active'
                    );


                previousSlide
                    .classList
                    .add(
                        direction
                        ===
                        'next'
                            ?
                            'is-leaving-to-left'
                            :
                            'is-leaving-to-right'
                    );


                previousSlide
                    .setAttribute(
                        'aria-hidden',
                        'true'
                    );


                nextSlide
                    .classList
                    .add(
                        'is-active'
                    );


                nextSlide
                    .classList
                    .add(
                        direction
                        ===
                        'next'
                            ?
                            'is-entering-from-right'
                            :
                            'is-entering-from-left'
                    );


                nextSlide
                    .setAttribute(
                        'aria-hidden',
                        'false'
                    );


                slideStage
                    ?.classList
                    .add(
                        'is-transitioning'
                    );


                transitionTimer =
                    setTimeout(
                        () => {

                            clearMotionClasses();


                            transitionTimer =
                                null;

                        },
                        DASHBOARD.transitionMs
                        +
                        50
                    );
            }


            /* =================================================
               THUMBNAILS
            ================================================= */

            thumbnails.forEach(
                (
                    button,
                    indexThumb
                ) => {

                    const active =
                        indexThumb
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
                    indexDot
                ) => {

                    dot.classList.toggle(
                        'is-active',
                        indexDot
                        ===
                        currentSlide
                    );
                }
            );


            /* =================================================
               PAUSE TEMPORARY
            ================================================= */

            if (
                userInteraction
            ) {

                pauseTemporarily();
            }


            /* =================================================
               SLIDE 3
            ================================================= */

            if (
                currentSlide
                ===
                2
            ) {

                setTimeout(
                    renderGrowthChart,
                    targetIndex
                    ===
                    previousIndex
                        ?
                        0
                        :
                        90
                );
            }


            /* =================================================
               SLIDE 5
            ================================================= */

            if (
                currentSlide
                ===
                4
            ) {

                setTimeout(
                    renderLocationMap,
                    targetIndex
                    ===
                    previousIndex
                        ?
                        0
                        :
                        90
                );
            }


            refreshIcons();
        }


        function userNavigate(
            index,
            directionHint = null
        )
        {
            showSlide(
                index,
                true,
                directionHint
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


            clearInterval(
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
                setInterval(
                    () => {

                        showSlide(
                            currentSlide
                            +
                            1,
                            false,
                            'next'
                        );

                    },
                    DASHBOARD.autoplayDelay
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

                clearTimeout(
                    resumeTimer
                );
            }


            resumeTimer =
                setTimeout(
                    () => {

                        resumeTimer =
                            null;


                        startAutoplay();

                    },
                    DASHBOARD.resumeDelay
                );
        }


        /* =====================================================
           PAUSE BUTTON
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


            pauseButton
                .setAttribute(
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
            event
                ?.preventDefault();


            event
                ?.stopPropagation();


            autoplayEnabled =
                !autoplayEnabled;


            if (
                resumeTimer
            ) {

                clearTimeout(
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
        ===================================================== */

        prevButton
            ?.addEventListener(
                'click',
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    userNavigate(
                        currentSlide
                        -
                        1,
                        'prev'
                    );
                }
            );


        /* =====================================================
           NEXT BUTTON
        ===================================================== */

        nextButton
            ?.addEventListener(
                'click',
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    userNavigate(
                        currentSlide
                        +
                        1,
                        'next'
                    );
                }
            );


        /* =====================================================
           PAUSE
        ===================================================== */

        pauseButton
            ?.addEventListener(
                'click',
                toggleAutoplay
            );


        /* =====================================================
           THUMBNAIL
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

        const handleKeyboard =
            event => {

                if (
                    event.key
                    ===
                    'ArrowLeft'
                ) {

                    event.preventDefault();


                    userNavigate(
                        currentSlide
                        -
                        1,
                        'prev'
                    );
                }


                if (
                    event.key
                    ===
                    'ArrowRight'
                ) {

                    event.preventDefault();


                    userNavigate(
                        currentSlide
                        +
                        1,
                        'next'
                    );
                }
            };


        deck.addEventListener(
            'keydown',
            handleKeyboard
        );


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
           SWIPE
        ===================================================== */

        const isInteractiveTarget =
            target => {

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
            };


        const resetSwipe =
            () => {

                pointerStartX =
                    null;


                pointerStartY =
                    null;


                swipePointerId =
                    null;
            };


        const releaseSwipePointer =
            pointerId => {

                if (
                    pointerId
                    ===
                    null
                    ||
                    pointerId
                    ===
                    undefined
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

                }
            };


        const finishSwipe =
            event => {

                if (
                    pointerStartX
                    ===
                    null
                    ||
                    pointerStartY
                    ===
                    null
                ) {

                    resetSwipe();

                    return;
                }


                if (
                    swipePointerId
                    !==
                    null
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
                 * Terlalu pendek.
                 */
                if (
                    Math.abs(
                        dx
                    )
                    <
                    DASHBOARD.swipeMinDistance
                ) {

                    return;
                }


                /*
                 * Gerakan vertikal lebih dominan.
                 * Biarkan browser scroll.
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


                if (
                    dx > 0
                ) {

                    userNavigate(
                        currentSlide
                        -
                        1,
                        'prev'
                    );

                } else {

                    userNavigate(
                        currentSlide
                        +
                        1,
                        'next'
                    );
                }
            };


        swipeSurface.addEventListener(
            'pointerdown',
            event => {

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

                    }
                }
            },
            {
                passive:
                    true
            }
        );


        swipeSurface.addEventListener(
            'pointerup',
            event => {

                const capturedId =
                    swipePointerId;


                finishSwipe(
                    event
                );


                releaseSwipePointer(
                    capturedId
                );
            },
            {
                passive:
                    true
            }
        );


        swipeSurface.addEventListener(
            'pointercancel',
            () => {

                const capturedId =
                    swipePointerId;


                resetSwipe();


                releaseSwipePointer(
                    capturedId
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


        /*
         * Control buttons tidak ikut event swipe.
         */
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

        const fullscreenElement =
            () =>

                document.fullscreenElement

                ||

                document.webkitFullscreenElement

                ||

                null;


        const isDashboardFullscreen =
            () =>

                fullscreenElement()
                ===
                deck;


        async function togglePresentation(
            event
        )
        {
            event
                ?.preventDefault();


            event
                ?.stopPropagation();


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


            setTimeout(
                () => {

                    renderGrowthChart();

                    renderLocationMap();

                    refreshIcons();

                },
                120
            );
        }


        presentationButton
            ?.addEventListener(
                'click',
                togglePresentation
            );


        fullscreenInside
            ?.addEventListener(
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


        /* =====================================================
           WITA CLOCK
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


        setInterval(
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

                clearTimeout(
                    resizeTimer
                );


                resizeTimer =
                    setTimeout(
                        () => {

                            renderGrowthChart();

                            renderLocationMap();

                        },
                        150
                    );
            }
        );


        /* =====================================================
           INIT
        ===================================================== */

        showSlide(
            0,
            false,
            'next'
        );


        updatePauseButton();


        startAutoplay();


        updatePresentationButton();


        refreshIcons();

    }
);


/* =========================================================
   SLIDE 3 - GROWTH CHART
========================================================= */

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
       RAW DATA
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
            points[
                0
            ]
            .value;


        const lastValue =
            points[
                points.length
                -
                1
            ]
            .value;


        const percentage =
            firstValue > 0
                ?
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
                100
                :
                0;


        const status =
            percentage > .05
                ?
                'is-up'
                :
                percentage < -.05
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
                ?.createIcons
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
       SVG HELPER
    ===================================================== */

    const createSvg =
        (
            tag,
            attributes = {}
        ) => {

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
        };


    /* =====================================================
       RANGE
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
                .15,
                1
            );
    }


    const extraSpace =
        Math.max(

            difference
            *
            .30,

            rawMax
            *
            .025,

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

    const getX =
        index =>

            points.length
            ===
            1

                ?

                padding.left
                +
                (
                    plotWidth
                    /
                    2
                )

                :

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
                plotWidth;


    /* =====================================================
       Y POSITION
    ===================================================== */

    const getY =
        value => {

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
        };


    /* =====================================================
       DEFINITIONS
    ===================================================== */

    const defs =
        createSvg(
            'defs'
        );


    /* =====================================================
       AREA GRADIENT
    ===================================================== */

    const areaGradient =
        createSvg(
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
        createSvg(
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
        createSvg(
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
        createSvg(
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
        createSvg(
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
        createSvg(
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
        createSvg(
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
       GRID
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
            createSvg(
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
            createSvg(
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
       BASE LINE
    ===================================================== */

    const baselineY =
        padding.top
        +
        plotHeight;


    svg.appendChild(
        createSvg(
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
       SMOOTH LINE PATH
    ===================================================== */

    const makeLinePath =
        items => {

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
                    items[
                        i
                    ];


                const next =
                    items[
                        i
                        +
                        1
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
        };


    const linePath =
        makeLinePath(
            coordinates
        );


    /* =====================================================
       AREA AND LINE
    ===================================================== */

    if (
        coordinates.length
        >=
        2
    ) {

        const last =
            coordinates[
                coordinates.length
                -
                1
            ];


        const first =
            coordinates[
                0
            ];


        const areaPath =
            `${linePath}`
            +
            ` L ${last.x} ${baselineY}`
            +
            ` L ${first.x} ${baselineY}`
            +
            ` Z`;


        svg.appendChild(
            createSvg(
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


        /* WHITE GLOW */
        svg.appendChild(
            createSvg(
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


        /* MAIN LINE */
        svg.appendChild(
            createSvg(
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
       X YEAR LABEL
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

    const showTooltip =
        (
            point,
            index
        ) => {

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
             * Tooltip tetap menampilkan nominal penuh
             * sesuai database.
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


                    const percentage =
                        previous > 0
                            ?
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
                            100
                            :
                            0;


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
                        percentage > .05
                            ?
                            'is-up'
                            :
                            percentage < -.05
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
        };


    const hideTooltip =
        () => {

            if (
                tooltip
            ) {

                tooltip.hidden =
                    true;
            }
        };


    /* =====================================================
       POINTS
    ===================================================== */

    coordinates.forEach(
        (
            point,
            index
        ) => {

            const group =
                createSvg(
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


            /* HALO */
            group.appendChild(
                createSvg(
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


            /* WHITE RING */
            group.appendChild(
                createSvg(
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


            /* POINT */
            group.appendChild(
                createSvg(
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
             * Touch hit area.
             */
            group.appendChild(
                createSvg(
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


/* =========================================================
   SLIDE 5 - LOCATION MAP
========================================================= */

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
        minLat
        ===
        maxLat
    ) {

        minLat -=
            .01;


        maxLat +=
            .01;
    }


    if (
        minLong
        ===
        maxLong
    ) {

        minLong -=
            .01;


        maxLong +=
            .01;
    }


    const latSpan =
        maxLat
        -
        minLat;


    const longSpan =
        maxLong
        -
        minLong;


    const padding =
        8;


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
                padding
                +
                xRatio
                *
                (
                    100
                    -
                    padding
                    *
                    2
                );


            const top =
                padding
                +
                yRatio
                *
                (
                    100
                    -
                    padding
                    *
                    2
                );


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


/* =========================================================
   HELPERS
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


    return normalized
        ?
        Number(
            normalized
        )
        :
        NaN;
}


/* =========================================================
   NUMBER FORMAT
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


    return number >= 0
        ?
        Math.floor(
            number
            *
            factor
        )
        /
        factor
        :
        Math.ceil(
            number
            *
            factor
        )
        /
        factor;
}


/* =========================================================
   DECIMAL FORMAT
========================================================= */

function trimCompactDecimal(
    number,
    minDigits = 0,
    maxDigits = 2
)
{
    return number.toLocaleString(
        'id-ID',
        {
            minimumFractionDigits:
                minDigits,

            maximumFractionDigits:
                maxDigits
        }
    );
}


/* =========================================================
   Y AXIS FORMAT
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


    /*
     * TRILIUN
     */
    if (
        abs
        >=
        1_000_000_000_000
    ) {

        return (
            'Rp '
            +
            trimCompactDecimal(

                truncateDashboardNumber(
                    number
                    /
                    1_000_000_000_000,
                    2
                ),

                2,

                2
            )
            +
            ' T'
        );
    }


    /*
     * MILIAR
     */
    if (
        abs
        >=
        1_000_000_000
    ) {

        return (
            'Rp '
            +
            trimCompactDecimal(

                truncateDashboardNumber(
                    number
                    /
                    1_000_000_000,
                    1
                ),

                1,

                1
            )
            +
            ' M'
        );
    }


    /*
     * JUTA
     */
    if (
        abs
        >=
        1_000_000
    ) {

        return (
            'Rp '
            +
            trimCompactDecimal(

                truncateDashboardNumber(
                    number
                    /
                    1_000_000,
                    1
                ),

                1,

                1
            )
            +
            ' Jt'
        );
    }


    return (
        'Rp '
        +
        formatDashboardNumber(
            number
        )
    );
}


/* =========================================================
   COMPACT PRESISI JS
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


    const compact =
        (
            divisor,
            suffix
        ) => {

            const result =
                truncateDashboardNumber(
                    number
                    /
                    divisor,
                    2
                );


            const formatted =
                result.toLocaleString(
                    'id-ID',
                    {
                        minimumFractionDigits:
                            0,

                        maximumFractionDigits:
                            2
                    }
                );


            return (
                `${prefix}${formatted} ${suffix}`
            );
        };


    if (
        abs
        >=
        1_000_000_000_000
    ) {

        return compact(
            1_000_000_000_000,
            'T'
        );
    }


    if (
        abs
        >=
        1_000_000_000
    ) {

        return compact(
            1_000_000_000,
            'M'
        );
    }


    if (
        abs
        >=
        1_000_000
    ) {

        return compact(
            1_000_000,
            'Jt'
        );
    }


    if (
        abs
        >=
        1_000
    ) {

        return compact(
            1_000,
            'Rb'
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
   LEGACY COMPATIBILITY
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