import MiniTimeline from './MiniTimeline';
import MiniSandbox from './MiniSandbox';
import { useTranslation } from 'react-i18next';
import styles from './Guide.module.css';

const EXAMPLE_FORMULAS = [
    "P v Q, ~P v R |= Q v R",
    "A v B, A |- B",
    "~A v B |= ~A v ~B",
    // testing
    "~p v t, a v z, ~z v ~t, p, ~a",
    "p v k, ~p v s, ~p v ~r, ~t v r, ~s v t, ~k",
    "a, ~a v ~b v c, ~a v ~d v f, ~d v b, ~c v g, ~f v g, ~g",
    "p v q v r, ~p v s v t, ~s v y, ~t, ~p v ~x, ~q v w, ~q v w (empty set)",
    "x v y, ~z v t, ~x v t, ~y v z, ~t (empty clause)",
    "~p v r v s, p v q, ~r v t, ~r v e, ~e v ~t v s (empty set)",
    "~a v b, ~a v f, ~a v ~b v c, ~c v f, ~c v ~d v f, a (empty set)",
    "~x v y, ~y v z v ~x, t v x, t v ~z, ~t v x, ~z (empty clause)",
    "A, ~A v B, ~B v C, ~C v D, ~D v E, ~E, F v ~F v G, H v I v ~H, J v K, J v K v L, J v K v ~M, N v O, P v N, Q v R v S, ~Q v T, ~R v U, ~S v V, ~T v ~U v W, X v Y v Z, ~X v W",
    "P v Q v R v S, P v Q v R v ~S, P v Q v ~R v S, P v Q v ~R v ~S, P v ~Q v R v S, P v ~Q v R v ~S, P v ~Q v ~R v S, P v ~Q v ~R v ~S, ~P v Q v R v S, ~P v Q v R v ~S, ~P v Q v ~R v S, ~P v Q v ~R v ~S, ~P v ~Q v R v S, ~P v ~Q v R v ~S, ~P v ~Q v ~R v S, ~P v ~Q v ~R v ~S"
];

interface GuideProps {
    onSelectExample: (formula: string) => void;
}

export default function Guide({ onSelectExample }: GuideProps) {
    const { t } = useTranslation();

    return (
        <div>
            <div className={styles.container}>
                <span className={styles.title}> {t('guide.try')}</span>
                <ul className={styles.examplesList}>
                    {EXAMPLE_FORMULAS.map((formula, index) => (
                        <li
                            key={index}
                            className={styles.exampleItem}
                            onClick={() => onSelectExample(formula)}
                        >
                            {formula}
                        </li>
                    ))}
                </ul>
            </div>

            <div className={styles.tutorialSection}>
                <MiniTimeline />
                <MiniSandbox />
            </div>
        </div>
    );
}