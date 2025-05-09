import Link from 'next/link'

export default function Forbidden() {
    return (
        <div className='flex w-96 h-60 flex-col mx-auto border rounded-lg items-center justify-center mt-10 space-y-2'>
            <h1 className='text-2xl'>Forbidden</h1>
            <p className='text-sm dark:text-slate-500 text-slate-400'>You are not authorized to access this resource.</p>
            <Link href="/" className='hover:underline border p-2 rounded-lg'>Return Home</Link>
        </div>
    )
}