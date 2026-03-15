import dynamic from 'next/dynamic';

const EditorPage = dynamic(() => import('@/views/Editor'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '100vh', background: '#0a0a12' }} />
  ),
});

export default function EditorRoute() {
  return <EditorPage />;
}
