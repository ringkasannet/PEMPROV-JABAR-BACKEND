import { collectionBUMD } from "./mongodb_handler.js";

export async function getAllBUMD(){
    try {
        const results = await collectionBUMD.find({}).toArray(); //TODO: check error handling
        // console.log('got results:',results)
        return results;
    }catch(error){ 
        throw error; 
    }
}

export async function getBUMDNotEmbedded(){
    const BUMDList=await getAllBUMD()
    const BUMDNotEmbedded=BUMDList.filter(BUMDItem=>{
        // console.log(BUMDItem)
        console.log("status embedding:",BUMDItem.embedding)
        return BUMDItem.embedding==false
    })
    return BUMDNotEmbedded
}

async function checkEmbeddings(){
// check all items in collection already embedded or not
for await (const doc of results){
    if(doc.embedding == true){
      console.log(`Update ${doc.name} ke Pinecone`);
  
      // embedding
      const embed = await myembed.embedding(doc.desc);
      
      // const embed = [];
  
      // for (let i = 0; i < 1536; i++) 
      //   embed.push(i)
  
      const vector = [
        {
          id: doc._id.toString(),
          values: embed,
          metadata: {
            name: doc.name,
            perda: doc.perda
          }
        }
      ];
  
      // update ke pinecone
      await pc.updatevdb(vector);
      
      // set embedding di mongodb -> true
      try {
        await dbClient.connect(); // koneksikan kembali ke mongodb
        
        const filter = { _id: doc._id };
        const update = { $set: { embedding: true }};
        
        await collection.updateOne(filter, update);
  
      } finally {
        await dbClient.close(); // tutup koneksi
      }
    };
  };
}
