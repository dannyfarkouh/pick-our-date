import { useEffect, useMemo, useState } from "react";
import emailjs from "@emailjs/browser";
import blueRose from "./assets/blue-rose.png";
import sarahAloImage from "./assets/sarah-alo-image.jpg";
import sarahFoodImage from "./assets/sarah-food-image.jpg";
import sarahAndMeImage from "./assets/sarah-and-me-image.jpg";
import "./App.css";

// Placeholder wording. Swap either string freely — everything below is driven
// by their lengths, not by these particular sentences.
const MESSAGE_EN =
    "Welcome back Sarah I missed you! I had a whole speech prepared but I didn't know how to word it out. The most important part is that I want to take you out on a date! Pick your perfect date idea and leave the rest to me.";

const MESSAGE_KO =
    "사라야, 돌아온 걸 환영해, 보고 싶었어! 할 말이 많았는데 어떻게 표현해야 할지 모르겠더라. 제일 중요한 건, 너랑 데이트하고 싶다는 거야! 네가 원하는 완벽한 데이트를 골라줘, 나머지는 나한테 맡겨.";

const CHARS_PER_SECOND = 40;
const START_DELAY_MS = 500;

// How long a page's exit animation runs before the next page actually mounts.
// Kept in sync with the .screen--leave-* animation-duration in App.css.
const PAGE_EXIT_MS = 220;

function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

emailjs.init("VFmkLwm16UeNft5se");

const SELECTION_PAGES = [
    {
        id: "dateCategory",
        title: "Date Category",
        options: ["Take-out", "I cook for princess Sarah", "Fancy dinner out"],
    },
    {
        id: "clothingStyle",
        title: "Clothing Color Code",
        options: ["Black", "White", "Beige"],
    },
    {
        id: "foodType",
        title: "Food Type",
        options: ["Japanese", "Chinese", "Italian", "Mexican", "Indian", "Steakhouse"],
    },
    {
        id: "day",
        title: "Day",
        options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        allowCustom: false,
    },
    {
        id: "alcoholicBeverage",
        title: "Drinks",
        options: ["Wine", "Moscata", "Espresso Martini", "Vodka Tonic"],
    },
];

// One shared duration, set by whichever paragraph is longer. Both therefore
// start and finish together instead of the shorter one stopping early — the
// denser Korean simply advances at its own slower per-character rate.
const TYPING_DURATION_MS = (Math.max(MESSAGE_EN.length, MESSAGE_KO.length) / CHARS_PER_SECOND) * 1000;

function useTypewriter(text, durationMs, delayMs) {
    const characters = useMemo(() => Array.from(text), [text]);
    const [typedCount, setTypedCount] = useState(0);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setTypedCount(characters.length);
            return;
        }

        let frame;
        let startTime;

        const tick = (now) => {
            if (startTime === undefined) startTime = now;
            const elapsed = now - startTime - delayMs;

            // Derived from elapsed time rather than incremented once per tick,
            // so a late or dropped frame is caught up on the next one instead
            // of pushing every remaining character back.
            const target = Math.min(
                characters.length,
                Math.max(0, Math.floor((elapsed / durationMs) * characters.length)),
            );

            // Returning the identical value lets React bail out, so the frames
            // where no new character is due cost nothing.
            setTypedCount((previous) => (previous === target ? previous : target));

            if (target < characters.length) {
                frame = requestAnimationFrame(tick);
            }
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [characters.length, durationMs, delayMs]);

    return [characters, typedCount];
}

// Every character is laid out from the first frame and only its colour and
// glow change as typing advances, so line breaks and centring are final before
// the animation starts — nothing reflows or re-centres as the text fills in.
function TypedParagraph({ text, className, lang }) {
    const [characters, typedCount] = useTypewriter(text, TYPING_DURATION_MS, START_DELAY_MS);

    return (
        <p className={className} lang={lang} aria-label={text}>
            {characters.map((character, index) => (
                <span
                    key={index}
                    aria-hidden="true"
                    className={
                        "message__char" +
                        (index < typedCount ? " is-typed" : "") +
                        (index === typedCount ? " is-caret" : "")
                    }
                >
                    {character}
                </span>
            ))}
        </p>
    );
}

function NextButton({ onClick }) {
    return (
        <button type="button" className="next-button" onClick={onClick}>
            <span className="next-button__label">Next</span>
            <svg
                className="next-button__icon"
                viewBox="0 0 24 24"
                width="1em"
                height="1em"
                fill="none"
                aria-hidden="true"
            >
                <path
                    d="M4 12h15M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    );
}

function LetterPage({ onNext, isLeaving }) {
    return (
        <main className={"screen screen--has-nav" + (isLeaving ? " screen--leave-forward" : "")}>
            <img src={blueRose} alt="" aria-hidden="true" className="floating-rose floating-rose--upper-left" />
            <img src={blueRose} alt="" aria-hidden="true" className="floating-rose floating-rose--upper-right" />
            <div className="letter">
                <TypedParagraph text={MESSAGE_EN} className="message" lang="en" />
                <hr className="letter__divider" />
                <TypedParagraph text={MESSAGE_KO} className="message message--korean" lang="ko" />
            </div>
            <img src={blueRose} alt="" aria-hidden="true" className="floating-rose floating-rose--lower-left" />
            <img src={blueRose} alt="" aria-hidden="true" className="floating-rose floating-rose--lower-right" />
            <NextButton onClick={onNext} />
        </main>
    );
}

function SelectionPage({ pageConfig, onSelect, onBack, direction, isLeaving }) {
    const [customValue, setCustomValue] = useState("");

    const handleCustomSubmit = (event) => {
        event.preventDefault();
        const trimmed = customValue.trim();
        if (trimmed) {
            onSelect(trimmed);
        }
    };

    const transitionClass = isLeaving
        ? direction === "back"
            ? " screen--leave-back"
            : " screen--leave-forward"
        : direction === "back"
          ? " screen--enter-back"
          : " screen--enter-forward";

    return (
        <main className={"screen screen--has-nav screen--stretch" + transitionClass}>
            <div className="selection-flow">
                <h1 className="selection-title">{pageConfig.title}</h1>
                {pageConfig.allowCustom !== false && (
                    <form className="custom-input" onSubmit={handleCustomSubmit}>
                        <input
                            type="text"
                            className="custom-input__field"
                            placeholder="Or you feel like something else?"
                            value={customValue}
                            onChange={(event) => setCustomValue(event.target.value)}
                        />
                        <button type="submit" className="custom-input__submit" aria-label="Submit your own answer">
                            <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path
                                    d="M4 12h15M13 6l6 6-6 6"
                                    stroke="currentColor"
                                    strokeWidth="1.75"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </form>
                )}
                <div className="selection-options">
                    {pageConfig.options.map((option, index) => (
                        <button key={index} className="selection-option" onClick={() => onSelect(option)}>
                            {option}
                        </button>
                    ))}
                </div>
            </div>
            <button className="back-button" onClick={onBack} aria-label="Go back to previous page">
                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                        d="M20 12H9M15 18l-6-6 6-6"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>
        </main>
    );
}

function GlowPhoto({ src, alt, hearts = "top-left-bottom-right", size = "default" }) {
    const [firstCorner, secondCorner] =
        hearts === "top-right-bottom-left" ? ["top-right", "bottom-left"] : ["top-left", "bottom-right"];

    return (
        <div className={"glow-photo" + (size === "large" ? " glow-photo--large" : "")}>
            <div className="glow-photo__frame">
                <img src={src} alt={alt} className="glow-photo__img" />
            </div>
            <span className={`glow-photo__heart glow-photo__heart--${firstCorner}`} aria-hidden="true">
                💗
            </span>
            <span className={`glow-photo__heart glow-photo__heart--${secondCorner}`} aria-hidden="true">
                💗
            </span>
        </div>
    );
}

function ConfirmationPage({ selections, onBack, onSubmit, isSubmitting, direction, isLeaving }) {
    const formatKey = (key) => {
        const spaced = key.replace(/([A-Z])/g, " $1").trim();
        return spaced.charAt(0).toUpperCase() + spaced.slice(1);
    };

    const transitionClass = isLeaving
        ? direction === "back"
            ? " screen--leave-back"
            : " screen--leave-forward"
        : direction === "back"
          ? " screen--enter-back"
          : " screen--enter-forward";

    return (
        <main className={"screen screen--has-nav" + transitionClass}>
            <div className="confirmation">
                <GlowPhoto src={sarahAloImage} alt="A photo of you" />
                <h1 className="confirmation-title">Confirm Your Selections Miss Sarah</h1>
                <div className="confirmation-summary">
                    {Object.entries(selections).map(([key, value]) => (
                        <div key={key} className="confirmation-item">
                            <span className="confirmation-label">{formatKey(key)}</span>
                            <span className="confirmation-value">{value}</span>
                        </div>
                    ))}
                </div>
                <button className="submit-button" onClick={onSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Submit"}
                </button>
            </div>
            <button className="back-button" onClick={onBack} aria-label="Go back to previous page">
                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                        d="M20 12H9M15 18l-6-6 6-6"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>
        </main>
    );
}

function SentPage({ direction, isLeaving }) {
    const transitionClass = isLeaving
        ? direction === "back"
            ? " screen--leave-back"
            : " screen--leave-forward"
        : direction === "back"
          ? " screen--enter-back"
          : " screen--enter-forward";

    return (
        <main className={"screen" + transitionClass}>
            <div className="sent">
                <GlowPhoto src={sarahFoodImage} alt="A photo of you enjoying dinner" size="large" />
                <div className="sent-message">
                    <p className="sent-message__korean" lang="ko">
                        그리움은 밤마다 별이 되어 반짝이고
                    </p>
                    <p className="sent-message__korean" lang="ko">
                        너를 향한 마음은 강물처럼 흐르네
                    </p>
                    <p className="sent-message__korean" lang="ko">
                        언제나 그 자리에 내 사랑은 머무네
                    </p>
                    <p className="sent-message__closing">See you soon princess Sarah ❤️</p>
                </div>
                <GlowPhoto
                    src={sarahAndMeImage}
                    alt="A photo of us together"
                    hearts="top-right-bottom-left"
                    size="large"
                />
            </div>
        </main>
    );
}

function DateOptionsPage({ onBack }) {
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [selections, setSelections] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [direction, setDirection] = useState("forward");
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // Plays the current page's exit animation, then applies `commit` (which
    // switches the page/selection state) once it's finished, so the outgoing
    // and incoming screens never appear on top of each other.
    const transitionTo = (nextDirection, commit) => {
        if (isLeaving) return;
        setDirection(nextDirection);
        setIsLeaving(true);
        window.setTimeout(
            () => {
                commit();
                setIsLeaving(false);
            },
            prefersReducedMotion() ? 0 : PAGE_EXIT_MS,
        );
    };

    const handleSelect = (option) => {
        const pageConfig = SELECTION_PAGES[currentPageIndex];
        transitionTo("forward", () => {
            setSelections((prev) => ({
                ...prev,
                [pageConfig.id]: option,
            }));
            setCurrentPageIndex((index) => (index < SELECTION_PAGES.length - 1 ? index + 1 : SELECTION_PAGES.length));
        });
    };

    const handleBack = () => {
        transitionTo("back", () => {
            if (currentPageIndex > 0) {
                setCurrentPageIndex((index) => index - 1);
            } else {
                onBack();
            }
        });
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await emailjs.send("service_25c7e3g", "template_zg4t5dn", {
                selections_json: JSON.stringify(selections, null, 2),
                dateCategory: selections.dateCategory || "",
                clothingStyle: selections.clothingStyle || "",
                foodType: selections.foodType || "",
                day: selections.day || "",
                alcoholicBeverage: selections.alcoholicBeverage || "",
            });
            transitionTo("forward", () => setHasSubmitted(true));
        } catch (error) {
            console.error("EmailJS error:", error);
            alert("There was an issue sending your selections. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (hasSubmitted) {
        return <SentPage direction={direction} isLeaving={isLeaving} />;
    }

    if (currentPageIndex < SELECTION_PAGES.length) {
        return (
            <SelectionPage
                key={SELECTION_PAGES[currentPageIndex].id}
                pageConfig={SELECTION_PAGES[currentPageIndex]}
                onSelect={handleSelect}
                onBack={handleBack}
                direction={direction}
                isLeaving={isLeaving}
            />
        );
    } else {
        return (
            <ConfirmationPage
                selections={selections}
                onBack={handleBack}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                direction={direction}
                isLeaving={isLeaving}
            />
        );
    }
}

function App() {
    const [page, setPage] = useState("letter");
    const [isLeaving, setIsLeaving] = useState(false);

    const goToOptions = () => {
        if (isLeaving) return;
        setIsLeaving(true);
        window.setTimeout(
            () => {
                setPage("options");
                setIsLeaving(false);
            },
            prefersReducedMotion() ? 0 : PAGE_EXIT_MS,
        );
    };

    return page === "letter" ? (
        <LetterPage onNext={goToOptions} isLeaving={isLeaving} />
    ) : (
        <DateOptionsPage onBack={() => setPage("letter")} />
    );
}

export default App;
