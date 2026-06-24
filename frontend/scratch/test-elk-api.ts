import ELK from 'elkjs/lib/elk-api';

const elk = new ELK();

async function run() {
  try {
    console.log("Running layout with elk-api...");
    const result = await elk.layout({
      id: 'root',
      children: [
        { id: 'n1', width: 100, height: 50 },
        { id: 'n2', width: 100, height: 50 }
      ],
      edges: [
        { id: 'e1', sources: ['n1'], targets: ['n2'] }
      ]
    });
    console.log("Success! Layout result children:", JSON.stringify(result.children, null, 2));
  } catch (err) {
    console.error("Failed:", err);
  }
}

run();
