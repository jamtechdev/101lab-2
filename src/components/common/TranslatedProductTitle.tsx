import React from 'react';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';

interface TranslatedProductTitleProps {
  title: string;
  description?: string;
  className?: string;
  descriptionClassName?: string;
  showTranslatingIndicator?: boolean;
}

/**
 * Component that displays product title (and optionally description)
 * with automatic translation based on viewer's language
 *
 * Usage:
 * <TranslatedProductTitle title={product.title} description={product.description} />
 */
export const TranslatedProductTitle: React.FC<TranslatedProductTitleProps> = ({
  title,
  description,
  className,
  descriptionClassName,
  showTranslatingIndicator = false,
}) => {
  const { translatedTitle, translatedDescription, isLoading } = useAutoTranslate(title, description);

  return (
    <>
      <div className={className}>
        {translatedTitle}
        {isLoading && showTranslatingIndicator && (
          <span className="text-xs text-muted-foreground ml-1">(translating...)</span>
        )}
      </div>
      {description && translatedDescription && (
        <div className={descriptionClassName}>
          {translatedDescription}
        </div>
      )}
    </>
  );
};

export default TranslatedProductTitle;
