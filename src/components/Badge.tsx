interface Props {
  text: string;
  variant?: 'primary' | 'secondary' | 'tertiary';
}

export default function Badge({ text, variant = 'primary' }: Props) {
  return (
    <span className={`badge badge-${variant}`}>
      {text}
    </span>
  );
}
