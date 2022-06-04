/* eslint-disable jsx-a11y/click-events-have-key-events */
import './GestureIndicator.scss';

export type Gesture = 'left palm' | 'right palm' | 'swipe down';

export type GestureIndicatorProps = {
  gesture: Gesture;
  text?: string;
};

const GestureIndicator = ({ gesture, text }: GestureIndicatorProps) => {
  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div className="gesture-indicator">
      {text && <h1 className="gesture-additional-text">{text}</h1>}
      <p className="gesture-icon">🖐</p>
      <h1 className="gesture-text">{gesture}</h1>
    </div>
  );
};

GestureIndicator.defaultProps = {
  text: '',
};

export default GestureIndicator;
