import TopicMap from '../../../shared/v2/TopicMap.jsx';
import { api } from '../api.js';
export default function Learn({ userId }) { return <TopicMap api={api} subject={'english'} userId={userId}/>; }
