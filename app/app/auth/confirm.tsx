import { useRouter } from 'expo-router';
import { Button, Notice, Placeholder } from '@/components';

export default function Page() {
  const router = useRouter();
  return (
    <Placeholder title="Check your email" eyebrow="ACCOUNT CONFIRMATION">
      <Notice kind="success" title="CONFIRMATION SENT">
        Open the link in your email, then return to sign in. GCSE Study Desk is independent and is not endorsed by AQA.
      </Notice>
      <Button onPress={() => router.replace('/auth/sign-in')}>Return to sign in</Button>
    </Placeholder>
  );
}
