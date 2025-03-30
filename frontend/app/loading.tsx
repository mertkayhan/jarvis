import { PacmanLoader } from "react-spinners"

export default function Loading() {
    return (
        <>
            <div className="mx-auto flex w-96 h-96 justify-center items-center" >
                <PacmanLoader color="#94a3b8" />
            </div>
        </>
    )
}