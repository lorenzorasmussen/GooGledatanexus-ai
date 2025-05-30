
import React from 'react';

interface WidgetProps {
  title: string;
  children: React.ReactNode;
  iconSvg?: string; // SVG string for the icon
  headerButton?: {
    text: string;
    onClick: () => void;
    disabled?: boolean;
    ariaLabel?: string;
  };
  customClasses?: string; // For additional styling like grid spans
}

const Widget: React.FC<WidgetProps> = React.memo(({ title, children, iconSvg, headerButton, customClasses }) => {
  return (
    <div className={`widget glass-panel ${customClasses || ''}`}>
      <div className="widget-header">
        <h3>{title}</h3>
        {headerButton && (
          <button
            onClick={headerButton.onClick}
            className="widget-header-button"
            disabled={headerButton.disabled}
            aria-label={headerButton.ariaLabel || headerButton.text}
          >
            {headerButton.text}
          </button>
        )}
        {iconSvg && (
          <span className="widget-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: iconSvg }} />
        )}
      </div>
      <div className="widget-content">
        {children}
      </div>
    </div>
  );
});

export default Widget;
