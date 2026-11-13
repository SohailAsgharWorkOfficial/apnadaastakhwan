/**
 * Consistent section heading: eyebrow → title → supporting copy.
 */
export default function SectionHeading({
  eyebrow,
  title,
  highlight,
  description,
  align = 'center',
  as: Tag = 'h2',
  className = '',
}) {
  const alignment =
    align === 'center' ? 'items-center text-center mx-auto' : 'items-start text-left';

  return (
    <div className={`flex flex-col ${alignment} ${className}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}

      <Tag className="text-3xl md:text-4xl font-bold text-balance">
        {title}
        {highlight && <span className="text-brand-red-ink"> {highlight}</span>}
      </Tag>

      {description && (
        <p
          className={`mt-3 text-gray-500 text-pretty ${
            align === 'center' ? 'max-w-2xl' : 'max-w-xl'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
