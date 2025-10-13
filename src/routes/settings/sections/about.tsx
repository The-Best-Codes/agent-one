import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full" asChild>
          <Link to="/credits">View Credits and Licenses</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
