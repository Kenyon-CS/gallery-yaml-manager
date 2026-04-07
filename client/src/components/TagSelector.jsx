export default function TagSelector({ label, options = [], value = [], onChange }) {
  function toggle(option) {
    const next = value.includes(option)
      ? value.filter((item) => item !== option)
      : [...value, option];
    onChange(next);
  }

  return (
    <div className="field-block">
      <label className="field-label">{label}</label>
      <div className="tag-grid">
        {options.map((option) => (
          <label key={option} className={`tag-pill ${value.includes(option) ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={value.includes(option)}
              onChange={() => toggle(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
