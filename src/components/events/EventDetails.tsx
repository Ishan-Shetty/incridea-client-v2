export default function EventDetails({ details }: { details: string }) {
  // Use a safe way to render HTML if possible, but for replication we assume intended HTML content.
  // In the original, ReactQuill was used with readOnly=true.
  // Here we will use a simple div with dangerouslySetInnerHTML, styled to match "bubble" theme if possible,
  // or just basic prose styling.
  
  return (
    <div 
      className="event-description w-full prose prose-invert prose-p:text-slate-300 prose-headings:text-slate-50 prose-a:text-sky-400 max-w-none"
      dangerouslySetInnerHTML={{ __html: details }} 
    />
  );
}
