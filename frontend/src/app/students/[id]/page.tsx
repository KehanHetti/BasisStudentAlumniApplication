interface Props { params: { id: string } }
export default function StudentDetailPage({ params }: Props) {
  return (
    <div>
      <h1 className="text-xl font-semibold">Student {params.id}</h1>
    </div>
  );
}
