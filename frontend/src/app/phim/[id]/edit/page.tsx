import MovieForm from '../../MovieForm';
export default async function EditMovie({ params }: { params: Promise<{id:string}> }) { const {id}=await params; return <MovieForm id={id}/>; }
