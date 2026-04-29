import { useState } from 'react';
import { type Node, type Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import Button from '../button/Button';
import styles from './Guide.module.css';
import { useTranslation } from 'react-i18next';
import BaseCanvas from "../BaseCanvas";
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TUTORIAL_FRAMES: { textKey: string; nodes: Node[]; edges: Edge[] }[] = [
    {
        textKey: "tutorial.timelineFrame1",
        nodes: [
            {
                id: 'c1',
                type: 'clause',
                position: { x: 150, y: 50 },
                data: {
                    clause: {
                        id: 'c1',
                        literals: [{ name: 'P', polarity: true }, { name: 'Q', polarity: false }],
                        removed: false
                    }
                }
            },
            {
                id: 'c2',
                type: 'clause',
                position: { x: 350, y: 50 },
                data: {
                    clause: {
                        id: 'c2',
                        literals: [{ name: 'P', polarity: false }, { name: 'Q', polarity: true }],
                        removed: false
                    }
                }
            }
        ],
        edges: []
    },
    {
        textKey: "tutorial.timelineFrame2",
        nodes: [
            {
                id: 'c1',
                type: 'clause',
                position: {x: 150, y: 50},
                data: {
                    clause: {
                        id: 'c1',
                        literals: [{name: 'P', polarity: true}, {name: 'Q', polarity: false}],
                        removed: false
                    },
                    isSelected: true
                }
            },
            {
                id: 'c2',
                type: 'clause',
                position: {x: 350, y: 50},
                data: {
                    clause: {
                        id: 'c2',
                        literals: [{name: 'P', polarity: false}, {name: 'Q', polarity: true}],
                        removed: false
                    },
                    isSelected: true
                }
            },
            {
                id: 'res1',
                type: 'clause',
                position: {x: 250, y: 150},
                data: {
                    clause: {
                        id: 'res1',
                        literals: [{name: 'Q', polarity: true}, {name: 'Q', polarity: false}],
                        removed: false
                    },
                    isHighlighted: true
                }
            }
        ],
        edges: [
            {id: 'e1', source: 'c1', target: 'res1', animated: false, style: {stroke: '#999', strokeWidth: 2}},
            {id: 'e2', source: 'c2', target: 'res1', animated: false, style: {stroke: '#999', strokeWidth: 2}}
        ]
    },
    {
        textKey: "tutorial.timelineFrame3",
        nodes: [
            {
                id: 'c1',
                type: 'clause',
                position: {x: 150, y: 50},
                data: {
                    clause: {
                        id: 'c1',
                        literals: [{name: 'P', polarity: true}, {name: 'Q', polarity: false}],
                        removed: true
                    },
                    isSelected: true
                }
            },
            {
                id: 'c2',
                type: 'clause',
                position: {x: 350, y: 50},
                data: {
                    clause: {
                        id: 'c2',
                        literals: [{name: 'P', polarity: false}, {name: 'Q', polarity: true}],
                        removed: true
                    },
                    isSelected: true
                }
            },
            {
                id: 'res1',
                type: 'clause',
                position: {x: 250, y: 150},
                data: {
                    clause: {
                        id: 'res1',
                        literals: [{name: 'Q', polarity: true}, {name: 'Q', polarity: false}],
                        removed: false
                    },
                    isHighlighted: true
                }
            }
        ],
        edges: []
    },
    {
        textKey: "tutorial.timelineFrame4",
        nodes: [
            {
                id: 'c1',
                type: 'clause',
                position: {x: 150, y: 50},
                data: {
                    clause: {
                        id: 'c1',
                        literals: [{name: 'P', polarity: true}, {name: 'Q', polarity: false}],
                        removed: true
                    },
                    isSelected: true
                }
            },
            {
                id: 'c2',
                type: 'clause',
                position: {x: 350, y: 50},
                data: {
                    clause: {
                        id: 'c2',
                        literals: [{name: 'P', polarity: false}, {name: 'Q', polarity: true}],
                        removed: true
                    },
                    isSelected: true
                }
            },
            {
                id: 'res1',
                type: 'clause',
                position: {x: 250, y: 150},
                data: {
                    clause: {
                        id: 'res1',
                        literals: [{name: 'Q', polarity: true}, {name: 'Q', polarity: false}],
                        removed: true
                    },
                    isHighlighted: true
                }
            }
        ],
        edges: []
    }
];

export default function MiniTimeline() {
    const { t } = useTranslation();
    const [frameIndex, setFrameIndex] = useState(0);
    const currentFrame = TUTORIAL_FRAMES[frameIndex];

    return (
        <div>
            {/*<h4 className={styles.boldText}>{t('tutorial.timelineTitle')}</h4>*/}
            {/*<p className={styles.text}>{t('tutorial.solveExplanation')}</p>*/}
            <p className={styles.text}>{t(currentFrame.textKey)}</p>

            <div className={styles.canvasWrapper}>
                <BaseCanvas
                    nodes={currentFrame.nodes}
                    edges={currentFrame.edges}
                    nodesDraggable={false}
                    zoomOnScroll={false}
                    defaultViewport={{ x: 0, y: 0, zoom: 1.5 }}
                    translateExtent={[[-100, -50], [600, 300]]}
                />
            </div>

            <div className={styles.controls}>
                <Button
                    onClick={() => setFrameIndex(p => Math.max(p - 1, 0))}
                    disabled={frameIndex === 0}
                >
                    {t('tutorial.btnPrev')}
                    {/*<ChevronLeft size={28} className={styles.icon} />*/}
                </Button>
                <Button
                    onClick={() => setFrameIndex(p => Math.min(p + 1, TUTORIAL_FRAMES.length - 1))}
                    disabled={frameIndex === TUTORIAL_FRAMES.length - 1}
                >
                    {t('tutorial.btnNext')}
                    {/*<ChevronRight size={28} className={styles.icon} />*/}
                </Button>
            </div>
        </div>
    );
}