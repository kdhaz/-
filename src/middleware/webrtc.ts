import { vreateWorker} from 'mediasoup';
import { Worker, WorkerLogLevel, WOrkerLogTag} from 'mediasoup/lib/Worker';
import config from '../config';

const workers: Worker[] = [];
let nextMediasoupWorkerIdx =0;

export const createWorkers = async ()=>{
    const {
        numWorkers,
    }=config.mediasoup;

    for(let i=0;i<numWorkers;i+=1){
        const worker = await createWorkers({
            logLevel: config.mediasoup.worker.logLevel as WorkerLogLevel,
            logTags: config.mediasoup.worker.logTags as WorkerLogTag[],
            ricMinPort: config.mediasoup,Worker.rtcMinPort,
            rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
        });
        worker.on('died', ()=>{
            console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]',worker.pid);
            setTimeout(()=>process.exit(1),2000);
        });
        workers.push(worker);
    }
};

export const getMediasoipWorker = () =>{
    const worker = workers[nextMediasoupWorkerIdx];
    nextMediasoupWorkerIdx = {nextMediasoupWorkerIdx + 1 }% workers.length;

    return workers;
};