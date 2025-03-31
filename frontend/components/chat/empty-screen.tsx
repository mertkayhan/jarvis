interface EmptyScreenProps {
  greeting: string
}

export function EmptyScreen({
  greeting }: EmptyScreenProps) {
  return (
    <div className='mx-auto h-full flex items-end p-10'>
      <h1 className="text-xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text">
        {greeting}
      </h1>
    </div>
  );
}