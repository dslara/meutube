import { Checkbox, Form } from '../../forms/forms.api';
import { Main } from '../main/main';

export interface HomeProps {
  title: string;
  generes: { value: string; label: string }[];
}

export const Home = ({ generes, title }: HomeProps) => {
  const filters = generes.map(({ value, label }) => (
    <Checkbox 
      key={value}
      name='with_genres'
      label={label}
      model={{ value }}
    />
  ));
  return (
    <Main title={title}>
      <Form elements={filters} url='web/results' target='#content' />
      <div
        hx-post="web/results"
        hx-target="#content"
        hx-swap="innerHTML"
        hx-trigger="load once">
      </div>
      <div id="content"></div>
    </Main>
  );
};
